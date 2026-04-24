import { EligibilityStatus, ShortlistStatus, SkillConfidence } from '@prisma/client';
import {
  CandidateScore,
  RawCertificate,
  RawCourse,
  RawJobProfile,
  RawJobSkill,
  RawProject,
  RawSkill,
  RawStudentProfile,
  compareCandidateScores,
  scoreCandidate,
} from './hsgm';

export interface StudentMatchInput {
  profileId: string;
  firstName: string;
  lastName: string;
  department: string;
  cgpa: number | null;
  gpaScale?: number;
  activeBacklogs: number;
  totalBacklogs: number;
  expectedGraduationYear: number | null;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  skills: Map<string, { confidence: SkillConfidence; source: string }>;
  softSkillNames: string[];
  projectText: string;
  certificationText: string;
  achievementText: string;
  resumeSummary?: string;
  certificationCount: number;
  internshipCount: number;
  hackathonCount: number;
  researchCount: number;
  projectCount: number;
  projects?: RawProject[];
  certifications?: RawCertificate[];
  coursesCompleted?: RawCourse[];
  githubActivity?: 'low' | 'moderate' | 'high' | 'very_high' | number;
  selfAssessmentScores?: number[];
  experienceFlag?: boolean;
}

export interface JobMatchInput {
  jobId: string;
  title: string;
  minCgpa: number | null;
  maxBacklogs: number | null;
  eligibleBranches: string[];
  allowedGraduationYears: number[];
  genderConstraint: string | null;
  requiredSkills: Map<string, number>;
  preferredSkills: Map<string, number>;
  softSkillsRequired: string[];
  rawJdText?: string;
  preferredKeywords?: string[];
}

export interface MatchedSkillInfo {
  skillName: string;
  confidence: SkillConfidence;
  matchType: 'explicit' | 'inferred';
  jobSkillType: 'required' | 'preferred';
  importance: number;
}

export interface FuzzySkillMatch {
  jobSkill: string;
  matchedWith: string;
  similarity: number;
  partialScore: number;
  path: string[];
  hops: number;
}

export interface EngineMatchResult extends CandidateScore {
  studentProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    cgpa: number | null;
    expectedGraduationYear: number | null;
  };
  overallMatchPercentage: number;
  requiredSkillCoverage: number;
  preferredSkillCoverage: number;
  semanticSimilarity: number;
  academicFit: number;
  projectRelevance: number;
  certificationRelevance: number;
  softSkillScore: number;
  majorAlignmentScore: number;
  experienceLevelScore: number;
  domainAlignmentScore: number;
  bonusScore: number;
  hiddenTalentFlag: boolean;
  biasAdjusted: boolean;
  weightProfile: 'HSGM';
  fuzzySkillMatches: FuzzySkillMatch[];
  matchedSkills: MatchedSkillInfo[];
  inferredMatchedSkills: MatchedSkillInfo[];
  missingSkills: string[];
  matchedSoftSkills: string[];
  recommendation: ShortlistStatus;
  reasonCodes: string[];
  reasonSummary: string;
  rawScore: number;
  treScore: number;
  boost: number;
  gpaOn4: number;
  rawGpa: number;
  rawGpaScale: number;
  fairnessAudit: CandidateScore['fairnessAudit'];
  scoreExplanation: CandidateScore['explanation'];
  rawScoreValue: number;
}

function mapSkillConfidence(confidence: SkillConfidence): number {
  switch (confidence) {
    case 'HIGH':
      return 8.5;
    case 'MEDIUM':
      return 6.5;
    case 'LOW':
    default:
      return 4.5;
  }
}

function toRawStudent(student: StudentMatchInput): RawStudentProfile {
  const skills: RawSkill[] = [...student.skills.entries()].map(([name, value]) => ({
    name,
    confidence: value.confidence,
    proficiency: mapSkillConfidence(value.confidence),
    source: value.source,
  }));

  return {
    id: student.profileId,
    firstName: student.firstName,
    lastName: student.lastName,
    department: student.department,
    rawGpa: student.cgpa,
    rawGpaScale: student.gpaScale ?? 10,
    activeBacklogs: student.activeBacklogs,
    totalBacklogs: student.totalBacklogs,
    expectedGraduationYear: student.expectedGraduationYear,
    skills,
    softSkills: student.softSkillNames,
    projects: student.projects ?? [],
    certifications: student.certifications ?? [],
    coursesCompleted: student.coursesCompleted ?? [],
    resumeSummary: student.resumeSummary,
    projectText: student.projectText,
    certificationText: student.certificationText,
    achievementText: student.achievementText,
    githubActivity: student.githubActivity,
    selfAssessmentScores: student.selfAssessmentScores,
    experienceFlag: student.experienceFlag,
  };
}

function toRawJob(job: JobMatchInput): RawJobProfile {
  return {
    id: job.jobId,
    title: job.title,
    minCgpa: job.minCgpa,
    maxBacklogs: job.maxBacklogs,
    eligibleBranches: job.eligibleBranches,
    allowedGraduationYears: job.allowedGraduationYears,
    requiredSkills: [...job.requiredSkills.entries()].map(([name, importance]): RawJobSkill => ({
      name,
      importance,
    })),
    preferredSkills: [...job.preferredSkills.entries()].map(([name, importance]): RawJobSkill => ({
      name,
      importance,
    })),
    softSkillsRequired: job.softSkillsRequired,
    rawJdText: job.rawJdText,
    preferredKeywords: job.preferredKeywords,
  };
}

function toLegacyFuzzySkills(candidate: CandidateScore): FuzzySkillMatch[] {
  return candidate.matchedSkills.map((skill) => ({
    jobSkill: skill.skillName,
    matchedWith: skill.skillName,
    similarity: skill.jobSkillType === 'required' ? 1 : 0.75,
    partialScore: skill.jobSkillType === 'required' ? 1 : 0.5,
    path: [skill.skillName],
    hops: 0,
  }));
}

function mapCandidate(candidate: CandidateScore): EngineMatchResult {
  const matchedSkills: MatchedSkillInfo[] = candidate.matchedSkills.map((skill) => ({
    skillName: skill.skillName,
    confidence: skill.confidence,
    matchType: skill.matchType,
    jobSkillType: skill.jobSkillType,
    importance: skill.importance,
  }));

  const inferredMatchedSkills: MatchedSkillInfo[] = candidate.inferredMatchedSkills.map((skill) => ({
    skillName: skill.skillName,
    confidence: skill.confidence,
    matchType: skill.matchType,
    jobSkillType: skill.jobSkillType,
    importance: skill.importance,
  }));

  return {
    ...candidate,
    overallMatchPercentage: Math.round(candidate.finalScore * 100),
    requiredSkillCoverage: candidate.requiredSkillCoverage,
    preferredSkillCoverage: candidate.preferredSkillCoverage,
    semanticSimilarity: candidate.semanticSimilarity,
    academicFit: candidate.academicFit,
    projectRelevance: candidate.projectRelevance,
    certificationRelevance: candidate.certificationRelevance,
    softSkillScore: candidate.softSkillScore,
    majorAlignmentScore: candidate.majorAlignmentScore,
    experienceLevelScore: candidate.experienceLevelScore,
    domainAlignmentScore: candidate.domainAlignmentScore,
    bonusScore: candidate.bonusScore,
    hiddenTalentFlag: candidate.hiddenTalentFlag,
    biasAdjusted: candidate.biasAdjusted,
    weightProfile: 'HSGM',
    fuzzySkillMatches: toLegacyFuzzySkills(candidate),
    matchedSkills,
    inferredMatchedSkills,
    missingSkills: candidate.missingSkills,
    matchedSoftSkills: candidate.matchedSoftSkills,
    recommendation: candidate.recommendation,
    reasonCodes: candidate.reasonCodes,
    reasonSummary: candidate.reasonSummary,
    rawScore: candidate.rawScore,
    treScore: candidate.treScore,
    boost: candidate.boost,
    gpaOn4: candidate.gpaOn4,
    rawGpa: candidate.rawGpa,
    rawGpaScale: candidate.rawGpaScale,
    fairnessAudit: candidate.fairnessAudit,
    scoreExplanation: candidate.explanation,
    rawScoreValue: candidate.rawScore,
  };
}

export class MatchingEngine {
  static compute(
    student: StudentMatchInput,
    job: JobMatchInput,
    _semanticScore = 0,
  ): EngineMatchResult {
    const candidate = mapCandidate(scoreCandidate(toRawStudent(student), toRawJob(job)));
    return {
      ...candidate,
      studentProfile: {
        id: student.profileId,
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department,
        cgpa: student.cgpa,
        expectedGraduationYear: student.expectedGraduationYear,
      },
    };
  }

  static compare(a: EngineMatchResult, b: EngineMatchResult) {
    return compareCandidateScores(
      { id: a.studentProfileId, finalScore: a.finalScore, rawScore: a.rawScore, overlap: a.overlap, treScore: a.treScore },
      { id: b.studentProfileId, finalScore: b.finalScore, rawScore: b.rawScore, overlap: b.overlap, treScore: b.treScore },
    );
  }
}
