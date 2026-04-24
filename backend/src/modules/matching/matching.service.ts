import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { EligibilityStatus, SkillConfidence, ShortlistStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { REDIS_CLIENT } from '../../config/redis.module';
import { Redis } from 'ioredis';
import { MatchingEngine, StudentMatchInput, JobMatchInput, EngineMatchResult } from './matching.engine';
import { PaginationDto, paginate } from '../../shared/dto/pagination.dto';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger('MatchingService');
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'match:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Run matching for a single student-job pair ───────────────────────────────

  async computeMatch(
    studentProfileId: string,
    jobId: string,
    options: { skipCache?: boolean; includeSemantics?: boolean } = {},
  ): Promise<EngineMatchResult> {
    const cacheKey = `${this.CACHE_PREFIX}${studentProfileId}:${jobId}`;

    // Check cache
    if (!options.skipCache) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (err) {
        this.logger.warn('Redis cache read failed:', err.message);
      }
    }

    const [studentInput, jobInput] = await Promise.all([
      this.buildStudentInput(studentProfileId),
      this.buildJobInput(jobId),
    ]);

    // Semantic similarity (optional, can be slow)
    let semanticScore = 0;
    if (options.includeSemantics && studentInput.resumeSummary && jobInput.rawJdText) {
      try {
        semanticScore = await this.aiService.computeSemanticSimilarity(
          studentInput.resumeSummary,
          jobInput.rawJdText,
        );
      } catch (err) {
        this.logger.warn('Semantic similarity failed, continuing without it:', err.message);
      }
    }

    const result = MatchingEngine.compute(studentInput, jobInput, semanticScore);

    // Persist to DB
    await this.persistMatchResult(result);

    // Cache result
    try {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      this.logger.warn('Redis cache write failed:', err.message);
    }

    return result;
  }

  // ─── Run matching for ALL eligible students for a job ───────────────────────────────

  async runMatchingForJob(
    jobId: string,
    options: { includeSemantics?: boolean } = {},
  ): Promise<{ processed: number; results: EngineMatchResult[] }> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    this.logger.log(`Running matching for job: ${job.title} (${jobId})`);

    // Get all active students
    const students = await this.prisma.studentProfile.findMany({
      select: { id: true },
    });

    const results: EngineMatchResult[] = [];
    let processed = 0;

    // Process in batches to avoid overwhelming the DB
    const batchSize = 10;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((s) =>
          this.computeMatch(s.id, jobId, { skipCache: true, includeSemantics: options.includeSemantics }),
        ),
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
          processed++;
        } else {
          this.logger.warn('Match computation failed for a student:', r.reason?.message);
        }
      }
    }

    this.logger.log(`Matching complete: ${processed}/${students.length} processed for job ${jobId}`);

    // Sort deterministically with the paper-aligned tie-breaks
    results.sort(MatchingEngine.compare);
    return { processed, results };
  }

  // ─── Generate shortlist from match results ───────────────────────────────

  async generateShortlist(
    jobId: string,
    options: {
      minMatchPercentage?: number;
      maxCandidates?: number;
      onlyEligible?: boolean;
    } = {},
  ) {
    const { minMatchPercentage = 40, maxCandidates = 50, onlyEligible = true } = options;

    const where: any = {
      jobId,
      overallMatchPercentage: { gte: minMatchPercentage },
    };
    if (onlyEligible) {
      where.eligibilityStatus = { in: [EligibilityStatus.ELIGIBLE, EligibilityStatus.PARTIALLY_ELIGIBLE] };
    }

    const matchResults = await this.prisma.matchResult.findMany({
      where,
      include: {
        studentProfile: { select: { id: true, firstName: true, lastName: true, userId: true } },
      },
      orderBy: [
        { overallMatchPercentage: 'desc' },
        { rawScore: 'desc' },
        { overlap: 'desc' },
        { id: 'asc' },
      ],
      take: maxCandidates,
    });

    const shortlisted: Array<{ match: any; application: any; shortlist: any }> = [];
    for (const match of matchResults) {
      // Check if student applied
      const application = await this.prisma.application.findUnique({
        where: {
          studentProfileId_jobId: {
            studentProfileId: match.studentProfileId,
            jobId,
          },
        },
      });

      if (application) {
        // Upsert shortlist entry
        const shortlist = await this.prisma.shortlist.upsert({
          where: { applicationId: application.id },
          update: { status: match.recommendation as ShortlistStatus },
          create: {
            applicationId: application.id,
            jobId,
            status: match.recommendation as ShortlistStatus,
          },
        });
        shortlisted.push({ match, application, shortlist });
      }
    }

    this.logger.log(
      `Shortlist generated for job ${jobId}: ${shortlisted.length} candidates from ${matchResults.length} matches`,
    );
    return shortlisted;
  }

  // ─── Get match results for admin dashboard ───────────────────────────────

  async getMatchResults(jobId: string, pagination: PaginationDto & {
    recommendation?: string;
    eligibilityStatus?: string;
    minScore?: number;
  }) {
    const { page = 1, limit = 20, recommendation, eligibilityStatus, minScore } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { jobId };
    if (recommendation) where.recommendation = recommendation;
    if (eligibilityStatus) where.eligibilityStatus = eligibilityStatus;
    if (minScore) where.overallMatchPercentage = { gte: minScore };

    const [items, total] = await Promise.all([
      this.prisma.matchResult.findMany({
        where,
        include: {
          studentProfile: {
            select: {
              id: true, firstName: true, lastName: true, department: true,
              cgpa: true, expectedGraduationYear: true, activeBacklogs: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: [
          { overallMatchPercentage: 'desc' },
          { rawScore: 'desc' },
          { overlap: 'desc' },
          { id: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.matchResult.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  // ─── Build inputs from DB ───────────────────────────────

  private async buildStudentInput(studentProfileId: string): Promise<StudentMatchInput> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        studentSkills: { include: { skill: true } },
        projects: { where: { deletedAt: null } },
        certifications: { where: { deletedAt: null } },
        achievements: { where: { deletedAt: null } },
        resumes: {
          where: { status: 'ACTIVE', isMaster: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) throw new NotFoundException(`Student profile ${studentProfileId} not found`);

    // Build skill map: name -> { confidence, source }
    const skillMap = new Map<string, { confidence: SkillConfidence; source: string }>();
    for (const ss of profile.studentSkills) {
      skillMap.set(ss.skill.name, { confidence: ss.confidence, source: ss.source || 'profile' });
    }

    const projectText = profile.projects
      .map((p) => `${p.title} ${p.description} ${(p.techStack || []).join(' ')} ${(p.highlights || []).join(' ')}`)
      .join('\n');

    const certificationText = profile.certifications
      .map((c) => `${c.name} ${c.issuingOrganization} ${c.inferredSkills.join(' ')}`)
      .join('\n');

    const achievementText = profile.achievements
      .map((a) => `${a.title} ${a.description || ''} ${a.type}`)
      .join('\n');

    const masterResume = profile.resumes[0];
    const resumeSummary = masterResume?.structuredContent
      ? (masterResume.structuredContent as any)?.summary
      : undefined;

    const structuredCourses = masterResume?.structuredContent
      ? ((masterResume.structuredContent as any)?.coursesCompleted || (masterResume.structuredContent as any)?.coursework || [])
      : [];

    const softSkillNames = profile.studentSkills
      .filter((ss) => ss.skill.category === 'SOFT_SKILLS')
      .map((ss) => ss.skill.name);

    const projects = profile.projects.map((p) => ({
      title: p.title,
      description: p.description || '',
      techStack: p.techStack || [],
      highlights: p.highlights || [],
      openSource: Boolean((p as any).repoUrl || (p as any).liveUrl),
      deployed: Boolean((p as any).liveUrl),
      impactLevel: ((p.highlights?.length || 0) >= 3 ? 'high' : 'medium') as 'high' | 'medium',
      keywords: [...(p.techStack || []), ...(p.highlights || [])].map((value) => value.toLowerCase()),
    }));

    const certifications = profile.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuingOrganization,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
      qrPresent: Boolean(c.credentialUrl && /qr|verify|credential/i.test(c.credentialUrl)),
      forged: c.isForged,
      skills: c.inferredSkills,
      description: c.description || undefined,
    }));

    return {
      profileId: studentProfileId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      department: profile.department,
      cgpa: profile.cgpa,
      gpaScale: profile.gpaScale,
      activeBacklogs: profile.activeBacklogs,
      totalBacklogs: profile.totalBacklogs,
      expectedGraduationYear: profile.expectedGraduationYear,
      tenthPercentage: profile.tenthPercentage,
      twelfthPercentage: profile.twelfthPercentage,
      skills: skillMap,
      softSkillNames,
      projectText,
      certificationText,
      achievementText,
      resumeSummary,
      projects,
      certifications,
      coursesCompleted: structuredCourses.map((course: any) => ({
        name: course.name || course.title || 'Course',
        skills: course.skills || course.skillNames || [],
        bloomLevel: course.bloomLevel ?? course.bloom ?? null,
        completed: course.completed ?? true,
      })),
      githubActivity: profile.githubUrl ? 'moderate' : 'low',
      selfAssessmentScores: profile.studentSkills
        .map((ss) => (ss.confidence === 'HIGH' ? 8.5 : ss.confidence === 'MEDIUM' ? 6.5 : 4.5)),
      experienceFlag: profile.achievements.some((a) => a.type === 'INTERNSHIP'),
      projectCount: profile.projects.length,
      certificationCount: profile.certifications.length,
      internshipCount: profile.achievements.filter((a) => a.type === 'INTERNSHIP').length,
      hackathonCount: profile.achievements.filter((a) => a.type === 'HACKATHON').length,
      researchCount: profile.achievements.filter((a) => a.type === 'RESEARCH_PAPER').length,
    };
  }

  private async buildJobInput(jobId: string): Promise<JobMatchInput> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      include: { jobSkills: { include: { skill: true } } },
    });

    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const requiredSkills = new Map<string, number>();
    const preferredSkills = new Map<string, number>();

    for (const js of job.jobSkills) {
      if (js.type === 'REQUIRED') {
        requiredSkills.set(js.skill.name, js.importance);
      } else {
        preferredSkills.set(js.skill.name, js.importance);
      }
    }

    const softSkillsRequired = job.jobSkills
      .filter((js) => js.skill.category === 'SOFT_SKILLS')
      .map((js) => js.skill.name);

    return {
      jobId,
      title: job.title,
      minCgpa: job.minCgpa,
      maxBacklogs: job.maxBacklogs,
      eligibleBranches: job.eligibleBranches,
      allowedGraduationYears: job.allowedGraduationYears,
      genderConstraint: job.genderConstraint,
      requiredSkills,
      preferredSkills,
      softSkillsRequired,
      rawJdText: job.rawJdText || undefined,
      preferredKeywords: job.keywords || [],
    };
  }

  private async persistMatchResult(result: EngineMatchResult) {
    await this.prisma.matchResult.upsert({
      where: {
        studentProfileId_jobId: {
          studentProfileId: result.studentProfileId,
          jobId: result.jobId,
        },
      },
      update: {
        eligibilityStatus: result.eligibilityStatus,
        eligibilityReasons: result.eligibilityReasons,
        overallMatchPercentage: result.overallMatchPercentage,
        rawScore: result.rawScore,
        overlap: result.overlap,
        treScore: result.treScore,
        boost: result.boost,
        gpaOn4: result.gpaOn4,
        rawGpa: result.rawGpa,
        rawGpaScale: result.rawGpaScale,
        requiredSkillCoverage: result.requiredSkillCoverage,
        preferredSkillCoverage: result.preferredSkillCoverage,
        semanticSimilarity: result.semanticSimilarity,
        academicFit: result.academicFit,
        projectRelevance: result.projectRelevance,
        certificationRelevance: result.certificationRelevance,
        fairnessAudit: result.fairnessAudit as any,
        scoreExplanation: result.scoreExplanation as any,
        matchedSkills: result.matchedSkills as any,
        inferredMatchedSkills: result.inferredMatchedSkills as any,
        missingSkills: result.missingSkills,
        recommendation: result.recommendation,
        reasonCodes: result.reasonCodes,
        reasonSummary: result.reasonSummary,
        updatedAt: new Date(),
      },
      create: {
        studentProfileId: result.studentProfileId,
        jobId: result.jobId,
        eligibilityStatus: result.eligibilityStatus,
        eligibilityReasons: result.eligibilityReasons,
        overallMatchPercentage: result.overallMatchPercentage,
        rawScore: result.rawScore,
        overlap: result.overlap,
        treScore: result.treScore,
        boost: result.boost,
        gpaOn4: result.gpaOn4,
        rawGpa: result.rawGpa,
        rawGpaScale: result.rawGpaScale,
        requiredSkillCoverage: result.requiredSkillCoverage,
        preferredSkillCoverage: result.preferredSkillCoverage,
        semanticSimilarity: result.semanticSimilarity,
        academicFit: result.academicFit,
        projectRelevance: result.projectRelevance,
        certificationRelevance: result.certificationRelevance,
        fairnessAudit: result.fairnessAudit as any,
        scoreExplanation: result.scoreExplanation as any,
        matchedSkills: result.matchedSkills as any,
        inferredMatchedSkills: result.inferredMatchedSkills as any,
        missingSkills: result.missingSkills,
        recommendation: result.recommendation,
        reasonCodes: result.reasonCodes,
        reasonSummary: result.reasonSummary,
      },
    });
  }

  async invalidateCache(studentProfileId?: string, jobId?: string) {
    const pattern = studentProfileId && jobId
      ? `${this.CACHE_PREFIX}${studentProfileId}:${jobId}`
      : studentProfileId
      ? `${this.CACHE_PREFIX}${studentProfileId}:*`
      : `${this.CACHE_PREFIX}*:${jobId}`;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn('Cache invalidation failed:', err.message);
    }
  }
}
