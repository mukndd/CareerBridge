// ─────────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────────

export type Role = 'STUDENT' | 'ADMIN' | 'RECRUITER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

// ─────────────────────────────────────────────
// STUDENT PROFILE
// ─────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  usn?: string;
  rollNo?: string;
  department: string;
  semester?: number;
  yearOfAdmission?: number;
  expectedGraduationYear?: number;
  cgpa?: number;
  gpaScale?: number;
  activeBacklogs: number;
  totalBacklogs: number;
  tenthPercentage?: number;
  tenthBoard?: string;
  twelfthPercentage?: number;
  twelfthBoard?: string;
  diplomaPercentage?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  profileCompleteness: number;
  studentSkills?: StudentSkill[];
  achievements?: Achievement[];
  projects?: Project[];
  certifications?: Certification[];
  resumes?: Resume[];
  createdAt: string;
}

// ─────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────

export type SkillCategory =
  | 'PROGRAMMING_LANGUAGE'
  | 'FRAMEWORK_LIBRARY'
  | 'DATABASE'
  | 'CLOUD_DEVOPS'
  | 'AI_ML'
  | 'DATA_ANALYTICS'
  | 'CS_FUNDAMENTALS'
  | 'SOFT_SKILLS'
  | 'DOMAIN_SKILLS'
  | 'TOOLS_PLATFORMS'
  | 'OTHER';

export type SkillConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Skill {
  id: string;
  name: string;
  aliases: string[];
  category: SkillCategory;
  description?: string;
}

export interface StudentSkill {
  id: string;
  skillId: string;
  skill: Skill;
  confidence: SkillConfidence;
  source?: string;
  inferenceReason?: string;
  yearsExperience?: number;
}

// ─────────────────────────────────────────────
// ACHIEVEMENTS / PROJECTS / CERTS
// ─────────────────────────────────────────────

export type AchievementType =
  | 'HACKATHON'
  | 'INTERNSHIP'
  | 'PROJECT'
  | 'RESEARCH_PAPER'
  | 'CERTIFICATION'
  | 'CLUB_LEADERSHIP'
  | 'AWARD'
  | 'WORKSHOP'
  | 'TECHNICAL_EVENT'
  | 'VOLUNTEERING'
  | 'OTHER';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  position?: string;
  url?: string;
  fileId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  highlights: string[];
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  inferredSkills: string[];
  fileId?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// RESUMES
// ─────────────────────────────────────────────

export type ResumeType = 'UPLOADED' | 'GENERATED' | 'ENHANCED' | 'TAILORED';
export type ResumeStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ResumeSection {
  id: string;
  sectionType: string;
  title: string;
  content: any;
  order: number;
}

export interface Resume {
  id: string;
  type: ResumeType;
  status: ResumeStatus;
  title: string;
  version: number;
  isMaster: boolean;
  targetJobId?: string;
  structuredContent?: any;
  htmlContent?: string;
  extractedText?: string;
  enhancementNotes?: any;
  extractedSkills?: any;
  fileId?: string;
  sections?: ResumeSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedResumeContent {
  summary?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    cgpa?: number;
    year?: number;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration?: string;
    description: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    title: string;
    description: string;
    techStack?: string[];
    bullets?: string[];
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    year?: number;
  }>;
  achievements?: string[];
}

export interface ResumeUploadResponse {
  resume: Resume;
  parsedContent: ParsedResumeContent;
  message: string;
}

// ─────────────────────────────────────────────
// COMPANIES & JOBS
// ─────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  location?: string;
  size?: string;
  hrEmail?: string;
  isVerified: boolean;
  jobs?: Job[];
  createdAt: string;
}

export type JobType = 'FULL_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'PART_TIME';
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface JobSkill {
  id: string;
  skillId: string;
  skill: Skill;
  type: 'REQUIRED' | 'PREFERRED';
  importance: number;
}

export interface Job {
  id: string;
  companyId: string;
  company: Pick<Company, 'id' | 'name' | 'logoUrl' | 'industry'>;
  title: string;
  description: string;
  responsibilities: string[];
  location?: string;
  jobType: JobType;
  status: JobStatus;
  ctcMin?: number;
  ctcMax?: number;
  ctcCurrency: string;
  eligibleBranches: string[];
  minCgpa?: number;
  maxBacklogs?: number;
  allowedGraduationYears: number[];
  keywords: string[];
  rawJdText?: string;
  applicationDeadline?: string;
  driveDate?: string;
  jobSkills: JobSkill[];
  _count?: { applications: number };
  createdAt: string;
}

// ─────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────

export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface Application {
  id: string;
  jobId: string;
  job: Pick<Job, 'id' | 'title' | 'company' | 'location' | 'ctcMin' | 'ctcMax'>;
  status: ApplicationStatus;
  resumeId?: string;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  interviewDate?: string;
  shortlist?: Shortlist;
}

// ─────────────────────────────────────────────
// MATCHING
// ─────────────────────────────────────────────

export type EligibilityStatus = 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'INELIGIBLE';
export type ShortlistStatus = 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'BORDERLINE' | 'NOT_RECOMMENDED';

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
  path?: string[];    // graph traversal path (e.g. ['pytorch', 'tensorflow', 'python'])
  hops?: number;      // 0=exact, 1=direct, 2=2-hop transitive, 3=3-hop transitive
}

export interface FairnessAudit {
  rawScore: number;
  boostedScore: number;
  yMaxGpa: number;
  gpaImpactAbs: number;
  gpaImpactRel: number;
  classification: 'fair' | 'minor_impact' | 'significant_impact';
}

export interface ScoreExplanation {
  summary: string;
  reasonCodes: string[];
  highlights: string[];
  warnings: string[];
  featureBreakdown: Array<{ key: string; label: string; value: number; weight: number }>;
  evidenceGraph?: {
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ from: string; to: string; relation: string }>;
  };
}

export type WeightProfile = 'TECH_HEAVY' | 'DATA_SCIENCE' | 'ACADEMIC' | 'BALANCED';

export interface MatchResult {
  id: string;
  studentProfileId: string;
  studentProfile?: Pick<StudentProfile, 'id' | 'firstName' | 'lastName' | 'department' | 'cgpa' | 'expectedGraduationYear'>;
  jobId: string;
  job?: Pick<Job, 'id' | 'title' | 'company'>;
  eligibilityStatus: EligibilityStatus;
  eligibilityReasons: string[];
  rawScore?: number;
  overlap?: number;
  treScore?: number;
  boost?: number;
  gpaOn4?: number;
  rawGpa?: number;
  rawGpaScale?: number;
  overallMatchPercentage: number;
  requiredSkillCoverage: number;
  preferredSkillCoverage: number;
  semanticSimilarity: number;
  academicFit: number;
  projectRelevance: number;
  certificationRelevance: number;
  fairnessAudit?: FairnessAudit;
  scoreExplanation?: ScoreExplanation;
  matchedSkills: MatchedSkillInfo[];
  inferredMatchedSkills: MatchedSkillInfo[];
  missingSkills: string[];
  recommendation: ShortlistStatus;
  reasonCodes: string[];
  reasonSummary: string;
  computedAt: string;
  // IEEE extended fields
  majorAlignmentScore?: number;
  experienceLevelScore?: number;
  domainAlignmentScore?: number;
  bonusScore?: number;
  hiddenTalentFlag?: boolean;
  biasAdjusted?: boolean;
  weightProfile?: WeightProfile;
  fuzzySkillMatches?: FuzzySkillMatch[];
  matchedSoftSkills?: string[];
}

export interface Shortlist {
  id: string;
  applicationId: string;
  jobId: string;
  status: ShortlistStatus;
  adminNotes?: string;
  application?: {
    id: string;
    studentProfile?: Pick<StudentProfile, 'id' | 'firstName' | 'lastName' | 'department' | 'cgpa' | 'expectedGraduationYear'>;
  };
  createdAt: string;
}

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

// ─────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────
// ANALYTICS (Admin)
// ─────────────────────────────────────────────

export interface AnalyticsOverview {
  overview: {
    totalStudents: number;
    totalJobs: number;
    openJobs: number;
    totalCompanies: number;
    totalApplications: number;
    recentApplications: number;
    totalMatches: number;
  };
  shortlistBreakdown: Record<ShortlistStatus, number>;
  applicationStatusBreakdown: Record<ApplicationStatus, number>;
}
