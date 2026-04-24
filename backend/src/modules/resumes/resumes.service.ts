import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ResumeType, ResumeStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type { ParsedResumeContent } from '../ai/interfaces/ai-provider.interface';
import { FilesService } from '../files/files.service';
import { SkillsService } from '../skills/skills.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger('ResumesService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly filesService: FilesService,
    private readonly skillsService: SkillsService,
    private readonly studentsService: StudentsService,
  ) {}

  // ─── Upload & Parse Existing Resume ───────────────────────────────

  async uploadResume(userId: string, file: Express.Multer.File) {
    const profile = await this.studentsService.ensureProfile(userId);

    // Save file
    const savedFile = await this.filesService.saveFile(file, 'RESUME', userId);

    // Extract raw text with confidence/warnings
    const extraction = await this.filesService.extractDocumentFromFile(savedFile.id);
    const rawText = extraction.text;

    if (!rawText || rawText.trim().length < 100) {
      throw new BadRequestException('Could not extract readable text from resume file');
    }
    if (extraction.needsManualReview) {
      this.logger.warn(`Resume extraction for ${savedFile.id} needs review: ${extraction.warnings.join('; ')}`);
    }

    // Skill extraction must never depend on the AI parser or OpenAI availability.
    // We keep the AI parse as an enhancement, but the upload should still complete
    // with deterministic skill extraction when no API key is configured.
    const skillExtraction = await this.skillsService.extractAndUpsertStudentSkills(
      profile.id,
      rawText,
      `resume:${savedFile.id}`,
      'Resume upload',
    );

    this.logger.log(`Extracted ${skillExtraction.skills.length} skills from uploaded resume`);

    let parsed: ParsedResumeContent = { skills: [] };
    try {
      this.logger.log(`Parsing uploaded resume for student ${profile.id}`);
      parsed = await this.aiService.parseResume(rawText);
    } catch (error) {
      this.logger.warn(
        `AI resume parser unavailable for ${savedFile.id}; falling back to extracted skills only: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Create resume record
    const resume = await this.prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        type: ResumeType.UPLOADED,
        status: ResumeStatus.ACTIVE,
        title: file.originalname.replace(/\.[^/.]+$/, '') || 'Uploaded Resume',
        extractedText: rawText,
        structuredContent: {
          ...(parsed as any),
          extraction: {
            confidence: extraction.confidence,
            warnings: extraction.warnings,
            sourceType: extraction.sourceType,
          },
        } as any,
        fileId: savedFile.id,
      },
    });

    const extractedSkillNames = [...new Set(skillExtraction.skills.map((skill) => skill.name))];
    const parsedSkills = Array.isArray((parsed as any)?.skills) ? (parsed as any).skills : [];
    const mergedSkills = [...new Set([...parsedSkills, ...extractedSkillNames])];

    const mergedStructuredContent = {
      ...(parsed as any),
      skills: mergedSkills,
      extraction: {
        confidence: extraction.confidence,
        warnings: extraction.warnings,
        sourceType: extraction.sourceType,
      },
      skillExtraction: {
        skills: skillExtraction.skills,
        rawExtracted: skillExtraction.rawExtracted,
      },
    };

    const updatedResume = await this.prisma.resume.update({
      where: { id: resume.id },
      data: {
        structuredContent: mergedStructuredContent as any,
        extractedSkills: skillExtraction.rawExtracted as any,
      },
    });

    return {
      resume: updatedResume,
      parsedContent: {
        ...(parsed as any),
        skills: mergedSkills,
      },
      message: 'Resume uploaded and parsed successfully',
    };
  }

  // ─── Generate Resume from Profile ───────────────────────────────

  async generateResume(userId: string, options: { targetRole?: string; additionalNotes?: string } = {}) {
    const profile = await this.studentsService.ensureProfile(userId);

    // Gather all student data
    const fullProfile = await this.prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: {
        achievements: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } },
        certifications: { where: { deletedAt: null } },
        studentSkills: { include: { skill: true } },
        user: { select: { email: true } },
      },
    });

    if (!fullProfile) throw new NotFoundException('Student profile not found');

    this.logger.log(`Generating resume for student ${profile.id}`);

    const generated = await this.aiService.generateResume({
      studentProfile: {
        firstName: fullProfile.firstName,
        lastName: fullProfile.lastName,
        email: fullProfile.user.email,
        phone: fullProfile.phone,
        department: fullProfile.department,
        cgpa: fullProfile.cgpa,
        expectedGraduationYear: fullProfile.expectedGraduationYear,
        linkedinUrl: fullProfile.linkedinUrl,
        githubUrl: fullProfile.githubUrl,
        portfolioUrl: fullProfile.portfolioUrl,
        tenthPercentage: fullProfile.tenthPercentage,
        twelfthPercentage: fullProfile.twelfthPercentage,
        usn: fullProfile.usn,
      },
      achievements: fullProfile.achievements,
      projects: fullProfile.projects,
      certifications: fullProfile.certifications,
      additionalNotes: options.additionalNotes,
      targetRole: options.targetRole,
    });

    // Store generated resume
    const resume = await this.prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        type: ResumeType.GENERATED,
        status: ResumeStatus.ACTIVE,
        title: options.targetRole
          ? `Resume for ${options.targetRole}`
          : 'Generated Resume',
        structuredContent: {
          summary: generated.summary,
          sections: generated.sections,
          atsKeywords: generated.atsKeywords,
        } as any,
        htmlContent: generated.htmlContent,
        isMaster: !(await this.prisma.resume.findFirst({
          where: { studentProfileId: profile.id, isMaster: true },
        })),
      },
    });

    // Create resume sections
    await this.prisma.resumeSection.createMany({
      data: generated.sections.map((s) => ({
        resumeId: resume.id,
        sectionType: s.type,
        title: s.title,
        content: s.content as any,
        order: s.order,
      })),
    });

    return {
      resume,
      generated,
      message: 'Resume generated successfully',
    };
  }

  // ─── Enhance Uploaded Resume ───────────────────────────────

  async enhanceResume(userId: string, resumeId: string) {
    const profile = await this.studentsService.ensureProfile(userId);
    const originalResume = await this.getOwnedResume(resumeId, profile.id);

    if (!originalResume.extractedText) {
      throw new BadRequestException('No extracted text found for this resume. Please re-upload.');
    }

    this.logger.log(`Enhancing resume ${resumeId} for student ${profile.id}`);

    const parsedContent = (originalResume.structuredContent || {}) as any;
    const enhanced = await this.aiService.enhanceResume(parsedContent, originalResume.extractedText);

    // Store as a new resume version (ENHANCED type)
    const enhancedResume = await this.prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        type: ResumeType.ENHANCED,
        status: ResumeStatus.ACTIVE,
        title: `Enhanced: ${originalResume.title}`,
        extractedText: originalResume.extractedText,
        structuredContent: {
          summary: enhanced.improvedSummary,
          originalContent: enhanced.originalContent,
          improvedBullets: enhanced.improvedBullets,
        } as any,
        htmlContent: enhanced.htmlContent,
        enhancementNotes: {
          missingSections: enhanced.missingSections,
          enhancementNotes: enhanced.enhancementNotes,
          improvedBullets: enhanced.improvedBullets,
        } as any,
        fileId: originalResume.fileId,
      },
    });

    // Extract and upsert inferred skills from enhancement
    if (enhanced.suggestedSkills?.length) {
      for (const skill of enhanced.suggestedSkills) {
        try {
          const skillRecord = await this.skillsService.findOrCreateSkill(skill.name);
          await this.prisma.studentSkill.upsert({
            where: {
              studentProfileId_skillId: { studentProfileId: profile.id, skillId: skillRecord.id },
            },
            update: { inferenceReason: skill.inferenceReason },
            create: {
              studentProfileId: profile.id,
              skillId: skillRecord.id,
              confidence: 'MEDIUM',
              source: `resume_enhancement:${enhancedResume.id}`,
              inferenceReason: skill.inferenceReason,
            },
          });
        } catch (err) {
          this.logger.warn(`Failed to upsert inferred skill "${skill.name}":`, err.message);
        }
      }
    }

    return {
      enhancedResume,
      enhancementDetails: enhanced,
      message: 'Resume enhanced successfully',
    };
  }

  // ─── Tailor Resume to JD ───────────────────────────────

  async tailorResumeForJob(userId: string, jobId: string, baseResumeId?: string) {
    const profile = await this.studentsService.ensureProfile(userId);

    // Get job with skills
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      include: {
        company: { select: { name: true } },
        jobSkills: { include: { skill: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    // Get base resume or full profile data
    let studentData: Record<string, any>;
    if (baseResumeId) {
      const resume = await this.getOwnedResume(baseResumeId, profile.id);
      studentData = {
        structuredContent: resume.structuredContent,
        extractedText: resume.extractedText,
      };
    } else {
      // Use full profile
      const fullProfile = await this.prisma.studentProfile.findUnique({
        where: { id: profile.id },
        include: {
          achievements: { where: { deletedAt: null } },
          projects: { where: { deletedAt: null } },
          certifications: { where: { deletedAt: null } },
          studentSkills: { include: { skill: true } },
        },
      });
      studentData = { profile: fullProfile };
    }

    // Parse JD if needed
    const jdText = job.rawJdText || job.description;
    const parsedJd = {
      jobTitle: job.title,
      company: job.company.name,
      requiredSkills: job.jobSkills.filter((s) => s.type === 'REQUIRED').map((s) => s.skill.name),
      preferredSkills: job.jobSkills.filter((s) => s.type === 'PREFERRED').map((s) => s.skill.name),
      responsibilities: job.responsibilities,
    };

    this.logger.log(`Tailoring resume for job: ${job.title}`);
    const tailored = await this.aiService.tailorResumeToJob(studentData, parsedJd, jdText);

    // Store tailored resume
    const tailoredResume = await this.prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        type: ResumeType.TAILORED,
        status: ResumeStatus.ACTIVE,
        title: `Tailored for ${job.title} at ${job.company.name}`,
        targetJobId: jobId,
        structuredContent: {
          summary: tailored.targetedSummary,
          sections: tailored.prioritizedSections,
          highlightedSkills: tailored.highlightedSkills,
        } as any,
        htmlContent: tailored.htmlContent,
      },
    });

    return {
      tailoredResume,
      tailoringDetails: tailored,
      targetJob: { id: jobId, title: job.title, company: job.company.name },
      message: 'Resume tailored for job successfully',
    };
  }

  // ─── Get Resumes ───────────────────────────────

  async getMyResumes(userId: string) {
    const profile = await this.studentsService.ensureProfile(userId);
    return this.prisma.resume.findMany({
      where: { studentProfileId: profile.id, deletedAt: null },
      include: { sections: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResume(userId: string, resumeId: string) {
    const profile = await this.studentsService.ensureProfile(userId);
    return this.getOwnedResume(resumeId, profile.id);
  }

  async deleteResume(userId: string, resumeId: string) {
    const profile = await this.studentsService.ensureProfile(userId);
    await this.getOwnedResume(resumeId, profile.id);
    await this.prisma.resume.update({ where: { id: resumeId }, data: { deletedAt: new Date() } });
    return { message: 'Resume deleted' };
  }

  async setMasterResume(userId: string, resumeId: string) {
    const profile = await this.studentsService.ensureProfile(userId);
    await this.getOwnedResume(resumeId, profile.id);

    // Unset all master flags, then set this one
    await this.prisma.resume.updateMany({
      where: { studentProfileId: profile.id },
      data: { isMaster: false },
    });
    return this.prisma.resume.update({ where: { id: resumeId }, data: { isMaster: true } });
  }

  private async getOwnedResume(resumeId: string, profileId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId, deletedAt: null },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.studentProfileId !== profileId) throw new ForbiddenException('Not your resume');
    return resume;
  }
}
