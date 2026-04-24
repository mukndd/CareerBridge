import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { AiService } from '../ai/ai.service';
import { FilesService } from '../files/files.service';
import { UpdateStudentProfileDto } from './dto/update-profile.dto';
import { CreateAchievementDto, UpdateAchievementDto } from './dto/achievement.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/certification.dto';
import { PaginationDto, paginate } from '../../shared/dto/pagination.dto';

export interface ProjectReviewResult {
  verdict: 'likely_authentic' | 'needs_review' | 'insufficient_evidence';
  score: number;
  summary: string;
  reasons: string[];
  warnings: string[];
  evidence?: {
    repo?: string;
    readmeFound?: boolean;
    stars?: number;
    language?: string;
    updatedAt?: string;
    readmeOverlap?: number;
  };
}

export interface CertificationReviewResult {
  verdict: 'verified' | 'needs_review' | 'rejected';
  score: number;
  summary: string;
  reasons: string[];
  warnings: string[];
  evidence?: {
    issuerTrusted?: boolean;
    credentialUrlTrusted?: boolean;
    issuerHost?: string;
    hasCredentialId?: boolean;
    issueDateProvided?: boolean;
    expiryDateProvided?: boolean;
  };
}

@Injectable()
export class StudentsService {
  private readonly logger = new Logger('StudentsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly skillsService: SkillsService,
    private readonly aiService: AiService,
    private readonly filesService: FilesService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, isVerified: true, lastLoginAt: true } },
        achievements: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        projects: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        certifications: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        studentSkills: {
          include: { skill: true },
          orderBy: [{ confidence: 'asc' }],
        },
        resumes: {
          where: { deletedAt: null, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async getProfileById(profileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { email: true } },
        achievements: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } },
        certifications: { where: { deletedAt: null } },
        studentSkills: { include: { skill: true } },
        resumes: { where: { deletedAt: null, status: 'ACTIVE', isMaster: true } },
      },
    });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateStudentProfileDto) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Student profile not found');

    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        profileCompleteness: this.computeProfileCompleteness({ ...profile, ...dto }),
      },
    });

    return updated;
  }

  // ─── Achievements ───────────────────────────────

  async createAchievement(userId: string, dto: CreateAchievementDto) {
    const profile = await this.ensureProfile(userId);
    const achievement = await this.prisma.achievement.create({
      data: {
        studentProfileId: profile.id,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    // Async skill extraction from achievement description
    if (dto.description) {
      this.skillsService
        .extractAndUpsertStudentSkills(
          profile.id,
          `${dto.title}. ${dto.description}`,
          `achievement:${achievement.id}`,
          `Achievement: ${dto.type}`,
        )
        .catch((err) => this.logger.warn('Skill extraction failed:', err.message));
    }

    return achievement;
  }

  async updateAchievement(userId: string, achievementId: string, dto: UpdateAchievementDto) {
    const profile = await this.ensureProfile(userId);
    await this.ensureAchievementOwnership(achievementId, profile.id);

    return this.prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteAchievement(userId: string, achievementId: string) {
    const profile = await this.ensureProfile(userId);
    await this.ensureAchievementOwnership(achievementId, profile.id);
    await this.prisma.achievement.update({
      where: { id: achievementId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Achievement deleted' };
  }

  // ─── Projects ───────────────────────────────

  async createProject(userId: string, dto: CreateProjectDto) {
    const profile = await this.ensureProfile(userId);
    const project = await this.prisma.project.create({
      data: {
        studentProfileId: profile.id,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    // Extract skills from project description + tech stack
    const extractionText = [
      dto.title,
      dto.description,
      dto.techStack?.join(', '),
      dto.highlights?.join('. '),
    ]
      .filter(Boolean)
      .join('\n');

    this.skillsService
      .extractAndUpsertStudentSkills(
        profile.id,
        extractionText,
        `project:${project.id}`,
        `Project: ${dto.title}`,
      )
      .catch((err) => this.logger.warn('Skill extraction failed:', err.message));

    return project;
  }

  async reviewProject(dto: CreateProjectDto): Promise<ProjectReviewResult> {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    let readmeFound = false;
    let repoMeta: { repo?: string; stars?: number; language?: string; updatedAt?: string; readmeOverlap?: number } = {};

    const projectText = [dto.title, dto.description, ...(dto.techStack ?? []), ...(dto.highlights ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const techText = (dto.techStack ?? []).join(' ').toLowerCase();

    if (!dto.title?.trim() || !dto.description?.trim()) {
      warnings.push('Project title and description are required for a meaningful review.');
      return {
        verdict: 'insufficient_evidence',
        score: 0,
        summary: 'Add a title and description before review.',
        reasons,
        warnings,
      };
    }

    const repo = this.parseGitHubRepo(dto.repoUrl);
    if (repo) {
      repoMeta.repo = repo;
      score += 35;
      reasons.push('GitHub repository link is valid');
      try {
        const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'CareerBridge',
          },
        });
        if (repoResponse.ok) {
          const repoData = await repoResponse.json() as any;
          repoMeta.stars = repoData.stargazers_count ?? 0;
          repoMeta.language = repoData.language ?? '';
          repoMeta.updatedAt = repoData.updated_at ?? '';
          score += repoMeta.stars ? Math.min(10, Math.round(repoMeta.stars / 20)) : 2;
          if (repoMeta.language) {
            const languageHit = [techText, projectText].some((text) => text.includes(repoMeta.language!.toLowerCase()));
            if (languageHit) {
              score += 10;
              reasons.push(`Repository language aligns with the stack (${repoMeta.language})`);
            }
          }

          const readmeCandidates = [
            repoData.default_branch ? `https://raw.githubusercontent.com/${repo}/${repoData.default_branch}/README.md` : '',
            `https://raw.githubusercontent.com/${repo}/main/README.md`,
            `https://raw.githubusercontent.com/${repo}/master/README.md`,
          ].filter(Boolean);

          for (const url of readmeCandidates) {
            const readmeResponse = await fetch(url);
            if (readmeResponse.ok) {
              const readmeText = await readmeResponse.text();
              if (readmeText.trim().length > 0) {
                readmeFound = true;
                score += 20;
                reasons.push('Repository includes a readable README');
                const overlapTerms = dto.description
                  .toLowerCase()
                  .split(/[^a-z0-9]+/g)
                  .filter((term) => term.length > 3);
                const overlap = overlapTerms.filter((term) => readmeText.toLowerCase().includes(term)).length;
                const normalizedOverlap = overlapTerms.length > 0 ? overlap / overlapTerms.length : 0;
                repoMeta.readmeOverlap = Math.round(normalizedOverlap * 100);
                if (normalizedOverlap >= 0.3) {
                  score += 15;
                  reasons.push('README text matches the project description');
                } else {
                  warnings.push('README exists, but it is only loosely aligned with the description.');
                }
                break;
              }
            }
          }

          const updatedAt = repoData.updated_at ? new Date(repoData.updated_at) : null;
          if (updatedAt) {
            const ageDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays <= 730) {
              score += 5;
              reasons.push('Repository activity looks recent');
            } else {
              warnings.push('Repository has not been updated recently.');
            }
          }
        } else {
          warnings.push('GitHub repository could not be fetched.');
        }
      } catch (error: any) {
        warnings.push(`Repository review failed: ${error?.message ?? 'unknown error'}`);
      }
    } else {
      warnings.push('No GitHub repository URL provided; review is based on text only.');
    }

    const textSignals = [
      /built|created|developed|implemented|designed/i.test(projectText),
      /real-time|dashboard|api|automation|production/i.test(projectText),
      /node|react|python|typescript|aws|docker|kubernetes|postgres|mongodb/i.test(projectText),
    ].filter(Boolean).length;
    score += textSignals * 8;
    if (textSignals >= 2) reasons.push('Description and stack read like a real build effort');

    if ((dto.techStack ?? []).length > 0) {
      score += Math.min(10, (dto.techStack ?? []).length * 2);
      reasons.push('Tech stack is explicitly listed');
    }

    if (score >= 70) {
      return {
        verdict: 'likely_authentic',
        score: Math.min(100, score),
        summary: 'This project looks credible enough to add as a portfolio item.',
        reasons,
        warnings,
        evidence: {
          ...repoMeta,
          readmeFound,
        },
      };
    }

    if (score >= 40) {
      return {
        verdict: 'needs_review',
        score: Math.min(100, score),
        summary: 'This project has some evidence, but it would benefit from a stronger repository trail.',
        reasons,
        warnings,
        evidence: {
          ...repoMeta,
          readmeFound,
        },
      };
    }

    return {
      verdict: 'insufficient_evidence',
      score: Math.min(100, score),
      summary: 'This project is too thin to validate confidently.',
      reasons,
      warnings,
      evidence: {
        ...repoMeta,
        readmeFound,
      },
    };
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const profile = await this.ensureProfile(userId);
    await this.ensureProjectOwnership(projectId, profile.id);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const profile = await this.ensureProfile(userId);
    await this.ensureProjectOwnership(projectId, profile.id);
    await this.prisma.project.update({ where: { id: projectId }, data: { deletedAt: new Date() } });
    return { message: 'Project deleted' };
  }

  // ─── Certifications ───────────────────────────────

  async createCertification(userId: string, dto: CreateCertificationDto, file?: Express.Multer.File) {
    const profile = await this.ensureProfile(userId);

    let fileId: string | undefined;
    if (file) {
      const savedFile = await this.filesService.saveFile(file, 'CERTIFICATE', userId);
      fileId = savedFile.id;
    }

    // Extract inferred skills from certification name
    const extractionText = `${dto.name} - ${dto.issuingOrganization}. ${dto.description || ''}`;
    const extractedSkills = await this.aiService.extractSkillsFromText(
      extractionText,
      `Certification: ${dto.name}`,
    );
    const inferredSkillNames = extractedSkills.map((s) => s.name);

    const certification = await this.prisma.certification.create({
      data: {
        studentProfileId: profile.id,
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        inferredSkills: inferredSkillNames,
        fileId,
      },
    });

    // Upsert skills
    this.skillsService
      .extractAndUpsertStudentSkills(
        profile.id,
        extractionText,
        `certification:${certification.id}`,
        `Certification: ${dto.name}`,
      )
      .catch((err) => this.logger.warn('Skill extraction failed:', err.message));

    return certification;
  }

  async reviewCertification(dto: CreateCertificationDto): Promise<CertificationReviewResult> {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const issuer = this.normalizeIssuer(dto.issuingOrganization);
    const urlHost = dto.credentialUrl ? (() => {
      try {
        return new URL(dto.credentialUrl).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        return '';
      }
    })() : '';

    const trustedIssuers = new Map<string, string[]>([
      ['amazon web services', ['aws.amazon.com', 'credly.com']],
      ['google', ['www.coursera.org', 'coursera.org', 'google.com', 'skillshop.withgoogle.com']],
      ['coursera', ['coursera.org', 'www.coursera.org']],
      ['meta', ['coursera.org', 'www.coursera.org', 'credly.com']],
      ['ibm', ['coursera.org', 'www.coursera.org', 'credly.com']],
      ['microsoft', ['learn.microsoft.com', 'credential.net', 'credly.com']],
      ['cncf', ['credly.com']],
      ['freecodecamp', ['freecodecamp.org']],
      ['hackerrank', ['hackerrank.com']],
      ['oracle', ['oracle.com', 'credly.com']],
    ]);

    let score = 0;
    const issuerTrusted = trustedIssuers.has(issuer) || Boolean(dto.issuingOrganization?.match(/aws|google|meta|ibm|microsoft|coursera|oracle|cncf|freecodecamp|hackerrank/i));
    const issuerHosts = trustedIssuers.get(issuer) ?? [];
    const credentialUrlTrusted = Boolean(urlHost) && issuerHosts.some((host) => urlHost.includes(host));

    if (issuerTrusted) {
      score += 35;
      reasons.push('Issuing organization is recognized');
    } else {
      warnings.push('Issuing organization is not on the trusted list.');
    }

    if (credentialUrlTrusted) {
      score += 30;
      reasons.push('Credential URL matches a trusted issuer domain');
    } else if (dto.credentialUrl) {
      warnings.push('Credential URL does not look like a trusted verification page.');
    }

    if (dto.credentialId?.trim()) {
      score += 15;
      reasons.push('Credential ID is present');
    } else {
      warnings.push('No credential ID was provided.');
    }

    if (dto.issueDate) {
      score += 10;
      reasons.push('Issue date is present');
    }
    if (dto.expiryDate) {
      score += 10;
      reasons.push('Expiry date is present');
    }

    const suspiciousText = [dto.name, dto.issuingOrganization, dto.description, dto.credentialId, dto.credentialUrl]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (/ai generated|chatgpt|lorem ipsum|sample certificate|fake cert|test credential/.test(suspiciousText)) {
      return {
        verdict: 'rejected',
        score: Math.max(0, score - 40),
        summary: 'This certification looks synthetic or placeholder-like and should not be added.',
        reasons,
        warnings: [...warnings, 'Suspicious placeholder language detected.'],
        evidence: {
          issuerTrusted,
          credentialUrlTrusted,
          hasCredentialId: Boolean(dto.credentialId?.trim()),
          issueDateProvided: Boolean(dto.issueDate),
          expiryDateProvided: Boolean(dto.expiryDate),
        },
      };
    }

    if (score >= 70) {
      return {
        verdict: 'verified',
        score: Math.min(100, score),
        summary: 'This certification has enough issuer evidence to add confidently.',
        reasons,
        warnings,
        evidence: {
          issuerTrusted,
          credentialUrlTrusted,
          issuerHost: urlHost,
          hasCredentialId: Boolean(dto.credentialId?.trim()),
          issueDateProvided: Boolean(dto.issueDate),
          expiryDateProvided: Boolean(dto.expiryDate),
        },
      };
    }

    return {
      verdict: 'needs_review',
      score: Math.min(100, score),
      summary: 'This certification can be added, but it should be reviewed because the validation trail is thin.',
      reasons,
      warnings,
      evidence: {
        issuerTrusted,
        credentialUrlTrusted,
        issuerHost: urlHost,
        hasCredentialId: Boolean(dto.credentialId?.trim()),
        issueDateProvided: Boolean(dto.issueDate),
        expiryDateProvided: Boolean(dto.expiryDate),
      },
    };
  }

  async updateCertification(userId: string, certId: string, dto: UpdateCertificationDto) {
    const profile = await this.ensureProfile(userId);
    await this.ensureCertOwnership(certId, profile.id);
    return this.prisma.certification.update({
      where: { id: certId },
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async deleteCertification(userId: string, certId: string) {
    const profile = await this.ensureProfile(userId);
    await this.ensureCertOwnership(certId, profile.id);
    await this.prisma.certification.update({ where: { id: certId }, data: { deletedAt: new Date() } });
    return { message: 'Certification deleted' };
  }

  // ─── Applications ───────────────────────────────

  async getMyApplications(userId: string, pagination: PaginationDto) {
    const profile = await this.ensureProfile(userId);
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where: { studentProfileId: profile.id },
        include: {
          job: {
            include: { company: { select: { name: true, logoUrl: true } } },
          },
          shortlist: true,
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where: { studentProfileId: profile.id } }),
    ]);

    return paginate(items, total, page, limit);
  }

  async applyToJob(userId: string, jobId: string, resumeId?: string) {
    const profile = await this.ensureProfile(userId);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null, status: 'OPEN' },
      include: { jobSkills: { include: { skill: true } } },
    });
    if (!job) throw new NotFoundException('Job not found or not open');

    const existing = await this.prisma.application.findUnique({
      where: { studentProfileId_jobId: { studentProfileId: profile.id, jobId } },
    });
    if (existing) throw new ForbiddenException('Already applied to this job');

    return this.prisma.application.create({
      data: {
        studentProfileId: profile.id,
        jobId,
        resumeId,
      },
      include: { job: { include: { company: { select: { name: true } } } } },
    });
  }

  async getJobMatchForStudent(userId: string, jobId: string) {
    const profile = await this.ensureProfile(userId);
    const match = await this.prisma.matchResult.findUnique({
      where: { studentProfileId_jobId: { studentProfileId: profile.id, jobId } },
      include: { job: { select: { title: true, company: { select: { name: true } } } } },
    });
    if (!match) return { message: 'Match not yet computed. Please check back later.' };
    return match;
  }

  // ─── Helpers ───────────────────────────────

  async ensureProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  private async ensureAchievementOwnership(achievementId: string, profileId: string) {
    const item = await this.prisma.achievement.findUnique({ where: { id: achievementId } });
    if (!item || item.studentProfileId !== profileId) {
      throw new ForbiddenException('Not your achievement');
    }
    if (item.deletedAt) throw new NotFoundException('Achievement not found');
  }

  private async ensureProjectOwnership(projectId: string, profileId: string) {
    const item = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!item || item.studentProfileId !== profileId) throw new ForbiddenException('Not your project');
  }

  private async ensureCertOwnership(certId: string, profileId: string) {
    const item = await this.prisma.certification.findUnique({ where: { id: certId } });
    if (!item || item.studentProfileId !== profileId) throw new ForbiddenException('Not your certification');
  }

  private parseGitHubRepo(url?: string): string | null {
    if (!url?.trim()) return null;
    try {
      const parsed = new URL(url.trim());
      if (parsed.hostname !== 'github.com') return null;
      const [owner, repo] = parsed.pathname.replace(/^\//, '').split('/');
      if (owner && repo) return `${owner}/${repo.replace(/\.git$/, '')}`;
    } catch {
      const direct = url.trim().replace(/^github\.com\//i, '').replace(/^https?:\/\//i, '');
      if (/^[\w.-]+\/[\w.-]+$/.test(direct)) return direct;
    }
    return null;
  }

  private normalizeIssuer(issuer: string): string {
    return issuer
      .toLowerCase()
      .replace(/[®™]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private computeProfileCompleteness(profile: any): number {
    const fields = [
      'firstName', 'lastName', 'phone', 'department', 'cgpa', 'usn',
      'yearOfAdmission', 'expectedGraduationYear', 'tenthPercentage',
      'linkedinUrl', 'githubUrl',
    ];
    const filled = fields.filter((f) => profile[f] != null && profile[f] !== '').length;
    return Math.round((filled / fields.length) * 100);
  }
}
