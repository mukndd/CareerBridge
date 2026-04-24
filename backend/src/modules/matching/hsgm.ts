import { EligibilityStatus, ShortlistStatus, SkillConfidence } from '@prisma/client';

export type GitHubActivityLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface RawSkill {
  name: string;
  proficiency?: number;
  confidence?: SkillConfidence;
  source?: string;
  domain?: string;
}

export interface RawProject {
  title: string;
  description?: string;
  techStack?: string[];
  highlights?: string[];
  impactLevel?: 'low' | 'medium' | 'high';
  openSource?: boolean;
  deployed?: boolean;
  keywords?: string[];
}

export interface RawCertificate {
  name: string;
  issuer: string;
  issueDate?: string | Date | null;
  expiryDate?: string | Date | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  qrPresent?: boolean;
  forged?: boolean;
  skills?: string[];
  description?: string;
  trust?: number;
}

export interface RawCourse {
  name: string;
  skills?: string[];
  bloomLevel?: number | null;
  completed?: boolean;
}

export interface RawStudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  rawGpa?: number | null;
  rawGpaScale?: number | null;
  activeBacklogs?: number;
  totalBacklogs?: number;
  expectedGraduationYear?: number | null;
  skills?: RawSkill[];
  softSkills?: string[];
  projects?: RawProject[];
  certifications?: RawCertificate[];
  coursesCompleted?: RawCourse[];
  resumeSummary?: string;
  projectText?: string;
  certificationText?: string;
  achievementText?: string;
  githubActivity?: GitHubActivityLevel | number;
  selfAssessmentScores?: number[];
  experienceFlag?: boolean;
}

export interface RawJobSkill {
  name: string;
  importance?: number;
}

export interface RawJobProfile {
  id: string;
  title: string;
  minCgpa?: number | null;
  maxBacklogs?: number | null;
  eligibleBranches?: string[];
  allowedGraduationYears?: number[];
  requiredSkills?: RawJobSkill[];
  preferredSkills?: RawJobSkill[];
  softSkillsRequired?: string[];
  rawJdText?: string;
  preferredKeywords?: string[];
}

export interface NormalizedCertificate {
  name: string;
  issuer: string;
  issuerKey: string;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  qrPresent: boolean;
  forged: boolean;
  skills: string[];
  description?: string;
  trust: number;
}

export interface NormalizedProject {
  title: string;
  description: string;
  techStack: string[];
  highlights: string[];
  openSource: boolean;
  deployed: boolean;
  impactLevel: 'low' | 'medium' | 'high';
  keywords: string[];
}

export interface NormalizedCourse {
  name: string;
  skills: string[];
  bloomLevel?: number | null;
  completed: boolean;
}

export interface NormalizedSkill {
  name: string;
  key: string;
  proficiency: number;
  confidence?: SkillConfidence;
  source?: string;
  domain: string;
}

export interface NormalizedStudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  departmentKey: string;
  rawGpa: number;
  rawGpaScale: number;
  gpaOn4: number;
  fGpa: number;
  activeBacklogs: number;
  totalBacklogs: number;
  expectedGraduationYear?: number | null;
  skills: NormalizedSkill[];
  softSkills: string[];
  projects: NormalizedProject[];
  certifications: NormalizedCertificate[];
  coursesCompleted: NormalizedCourse[];
  resumeSummary: string;
  projectText: string;
  certificationText: string;
  achievementText: string;
  githubActivity: number;
  selfAssessmentScores: number[];
  experienceFlag: boolean;
}

export interface NormalizedJobProfile {
  id: string;
  title: string;
  titleKey: string;
  minCgpa?: number | null;
  maxBacklogs?: number | null;
  eligibleBranches: string[];
  allowedGraduationYears: number[];
  requiredSkills: string[];
  preferredSkills: string[];
  softSkillsRequired: string[];
  rawJdText: string;
  preferredKeywords: string[];
}

export interface FeatureVector {
  fSem: number;
  fOverlap: number;
  fProj: number;
  fComp: number;
  fSoft: number;
  fOs: number;
  fCurriculum: number;
  fSelf: number;
  fBloom: number;
  fTrust: number;
  fCert: number;
  fGrowth: number;
  fGpa: number;
  experienceFlag: number;
}

export interface TreSignals {
  sigmaDepth: number;
  sigmaBreadth: number;
  sigmaElite: number;
  sigmaProj: number;
  sigmaComp: number;
  sigmaLead: number;
  sigmaOs: number;
  gactivity: number;
}

export interface FairnessAudit {
  rawScore: number;
  boostedScore: number;
  yMaxGpa: number;
  gpaImpactAbs: number;
  gpaImpactRel: number;
  classification: 'fair' | 'minor_impact' | 'significant_impact';
}

export interface EvidenceNode {
  id: string;
  type: 'student' | 'skill' | 'course' | 'certificate' | 'issuer' | 'project' | 'jobSkill';
  label: string;
}

export interface EvidenceEdge {
  from: string;
  to: string;
  relation: 'HAS_SKILL' | 'COMPLETED' | 'EARNED' | 'BUILT' | 'REQUIRES';
}

export interface EvidenceGraph {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}

export interface ScoreExplanation {
  summary: string;
  reasonCodes: string[];
  highlights: string[];
  warnings: string[];
  featureBreakdown: Array<{ key: keyof FeatureVector | 'tre'; label: string; value: number; weight: number }>;
  evidenceGraph: EvidenceGraph;
}

export interface CandidateScore {
  studentProfileId: string;
  jobId: string;
  finalScore: number;
  rawScore: number;
  overlap: number;
  boost: number;
  treScore: number;
  verdict: string;
  badges: string[];
  eligibilityStatus: EligibilityStatus;
  eligibilityReasons: string[];
  features: FeatureVector;
  treSignals: TreSignals;
  fairnessAudit: FairnessAudit;
  explanation: ScoreExplanation;
  warnings: string[];
  semanticSimilarity: number;
  requiredSkillCoverage: number;
  preferredSkillCoverage: number;
  projectRelevance: number;
  certificationRelevance: number;
  academicFit: number;
  softSkillScore: number;
  majorAlignmentScore: number;
  experienceLevelScore: number;
  domainAlignmentScore: number;
  bonusScore: number;
  hiddenTalentFlag: boolean;
  biasAdjusted: boolean;
  recommendation: ShortlistStatus;
  matchedSkills: Array<{ skillName: string; confidence: SkillConfidence; matchType: 'explicit' | 'inferred'; jobSkillType: 'required' | 'preferred'; importance: number }>;
  inferredMatchedSkills: Array<{ skillName: string; confidence: SkillConfidence; matchType: 'explicit' | 'inferred'; jobSkillType: 'required' | 'preferred'; importance: number }>;
  missingSkills: string[];
  matchedSoftSkills: string[];
  reasonCodes: string[];
  reasonSummary: string;
  gpaOn4: number;
  rawGpa: number;
  rawGpaScale: number;
}

export interface CandidateComparatorRecord {
  id: string;
  finalScore: number;
  rawScore: number;
  overlap: number;
  treScore: number;
}

export interface HsgmRankingResult {
  scores: CandidateScore[];
}

export interface HsgmScoringOptions {
  eliteIssuers?: string[];
}

const LTR_WEIGHTS = {
  semantic: 0.18,
  overlap: 0.16,
  tre: 0.14,
  certRelevance: 0.1,
  projectImpact: 0.09,
  competitive: 0.07,
  growth: 0.06,
  trust: 0.06,
  curriculumCoverage: 0.05,
  softSkills: 0.04,
  openSource: 0.03,
  gpa: 0.015,
  selfAssessment: 0.015,
  bloomLevel: 0.015,
  experienceFlag: 0,
} as const;

const TRE_WEIGHTS = {
  depth: 0.22,
  proj: 0.2,
  comp: 0.15,
  breadth: 0.12,
  elite: 0.12,
  lead: 0.1,
  os: 0.09,
} as const;

const DEFAULT_ELITE_ISSUERS = new Set([
  'google',
  'microsoft',
  'amazon',
  'aws',
  'nvidia',
  'meta',
  'ibm',
  'oracle',
  'coursera',
  'edx',
  'stanford',
  'mit',
  'harvard',
  'iit',
  'nptel',
  'kaggle',
]);

const LEADERSHIP_KEYWORDS = ['lead', 'president', 'captain', 'head', 'coordinator', 'organized', 'managed', 'mentor', 'founder', 'director'];
const COMPETITIVE_KEYWORDS = ['leetcode', 'codeforces', 'hackerrank', 'competitive', 'codechef', 'atcoder', 'kaggle', 'olympiad', 'gsoc', 'rated'];
const OPEN_SOURCE_KEYWORDS = ['open source', 'open-source', 'github', 'pull request', 'pull-request', 'contribution', 'contributor', 'fork', 'stars', 'starred'];
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'their', 'have', 'will',
  'into', 'using', 'built', 'build', 'role', 'job', 'position', 'team', 'company',
  'experience', 'skills', 'skill', 'required', 'preferred', 'must', 'should', 'able',
  'about', 'our', 'you', 'we', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by', 'as',
]);

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function mean(values: number[], fallback = 0): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function normaliseText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00ad/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normaliseKey(value: string): string {
  return normaliseText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

export function tokenise(value: string): string[] {
  return normaliseKey(value)
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token));
}

export function tokenSet(value: string): Set<string> {
  return new Set(tokenise(value));
}

export function intersectionSize<T>(left: Set<T>, right: Set<T>): number {
  let count = 0;
  for (const item of left) {
    if (right.has(item)) count++;
  }
  return count;
}

export function mapGitHubActivity(activity: GitHubActivityLevel | number | undefined): number {
  if (typeof activity === 'number') return clamp01(activity);
  switch (activity) {
    case 'low':
      return 0.1;
    case 'moderate':
      return 0.4;
    case 'high':
      return 0.7;
    case 'very_high':
      return 1.0;
    default:
      return 0.4;
  }
}

export function resolveDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isExpired(expiryDate?: Date | null): boolean {
  if (!expiryDate) return false;
  return expiryDate.getTime() < Date.now();
}

export function normaliseStudentProfile(raw: RawStudentProfile): NormalizedStudentProfile {
  const rawGpaScale = raw.rawGpaScale && raw.rawGpaScale > 0 ? raw.rawGpaScale : 10;
  const rawGpa = typeof raw.rawGpa === 'number'
    ? raw.rawGpa
    : typeof (raw as any).cgpa === 'number'
      ? (raw as any).cgpa
      : 0;
  const gpaOn4 = clamp(rawGpa * 4 / rawGpaScale, 0, 4);
  const fGpa = clamp01(rawGpa / rawGpaScale);
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    department: raw.department,
    departmentKey: normaliseKey(raw.department),
    rawGpa,
    rawGpaScale,
    gpaOn4,
    fGpa,
    activeBacklogs: raw.activeBacklogs ?? 0,
    totalBacklogs: raw.totalBacklogs ?? 0,
    expectedGraduationYear: raw.expectedGraduationYear ?? null,
    skills: (raw.skills ?? []).map((skill) => ({
      name: skill.name,
      key: normaliseKey(skill.name),
      proficiency: clamp(
        typeof skill.proficiency === 'number'
          ? skill.proficiency
          : skill.confidence === 'HIGH'
            ? 8.5
            : skill.confidence === 'MEDIUM'
              ? 6.5
              : 4.5,
        0,
        10,
      ),
      confidence: skill.confidence,
      source: skill.source,
      domain: normaliseKey(skill.domain || skill.name.split(/[/:,|-]/)[0] || 'other'),
    })),
    softSkills: (raw.softSkills ?? []).map(normaliseKey),
    projects: (raw.projects ?? []).map((project) => ({
      title: normaliseText(project.title),
      description: normaliseText(project.description || ''),
      techStack: (project.techStack ?? []).map(normaliseKey),
      highlights: (project.highlights ?? []).map(normaliseText),
      openSource: project.openSource ?? false,
      deployed: project.deployed ?? false,
      impactLevel: project.impactLevel ?? 'medium',
      keywords: (project.keywords ?? []).map(normaliseKey),
    })),
    certifications: (raw.certifications ?? []).map((cert) => ({
      name: normaliseText(cert.name),
      issuer: normaliseText(cert.issuer),
      issuerKey: normaliseKey(cert.issuer),
      issueDate: resolveDate(cert.issueDate),
      expiryDate: resolveDate(cert.expiryDate),
      credentialId: cert.credentialId ?? null,
      credentialUrl: cert.credentialUrl ?? null,
      qrPresent: Boolean(cert.qrPresent),
      forged: Boolean(cert.forged),
      skills: (cert.skills ?? []).map(normaliseKey),
      description: cert.description ? normaliseText(cert.description) : undefined,
      trust: 0,
    })),
    coursesCompleted: (raw.coursesCompleted ?? []).map((course) => ({
      name: normaliseText(course.name),
      skills: (course.skills ?? []).map(normaliseKey),
      bloomLevel: course.bloomLevel ?? null,
      completed: course.completed ?? true,
    })),
    resumeSummary: normaliseText(raw.resumeSummary || ''),
    projectText: normaliseText(raw.projectText || ''),
    certificationText: normaliseText(raw.certificationText || ''),
    achievementText: normaliseText(raw.achievementText || ''),
    githubActivity: mapGitHubActivity(raw.githubActivity),
    selfAssessmentScores: (raw.selfAssessmentScores ?? []).filter((value) => Number.isFinite(value)),
    experienceFlag: Boolean(raw.experienceFlag),
  };
}

export function normaliseJobProfile(raw: RawJobProfile): NormalizedJobProfile {
  return {
    id: raw.id,
    title: raw.title,
    titleKey: normaliseKey(raw.title),
    minCgpa: raw.minCgpa ?? null,
    maxBacklogs: raw.maxBacklogs ?? null,
    eligibleBranches: (raw.eligibleBranches ?? []).map(normaliseText),
    allowedGraduationYears: raw.allowedGraduationYears ?? [],
    requiredSkills: (raw.requiredSkills ?? []).map((skill) => normaliseText(skill.name)),
    preferredSkills: (raw.preferredSkills ?? []).map((skill) => normaliseText(skill.name)),
    softSkillsRequired: (raw.softSkillsRequired ?? []).map(normaliseText),
    rawJdText: normaliseText(raw.rawJdText || ''),
    preferredKeywords: (raw.preferredKeywords ?? []).map(normaliseKey),
  };
}

export function scoreCertificateTrust(
  cert: NormalizedCertificate,
  eliteIssuers: Set<string>,
): number {
  const issuer = cert.issuerKey;
  const unknownCert = issuer === 'unknowncert' || issuer.length === 0;
  const elite = eliteIssuers.has(issuer);
  const vApi = elite ? 1.0 : 0.3;
  const vQr = cert.qrPresent ? 1.0 : 0.0;
  const vMeta = 0.4 * (unknownCert ? 0 : 1) + 0.4 * (isExpired(cert.expiryDate) ? 0 : 1) + 0.2 * (cert.forged ? 0 : 1);
  if (cert.forged) return 0;
  return clamp01(0.5 * vApi + 0.25 * vQr + 0.25 * vMeta);
}

function countKeywordHits(texts: string[], keywords: string[]): number {
  const normalizedTexts = texts.map((text) => normaliseKey(text)).join(' ');
  return keywords.reduce((count, keyword) => {
    const token = normaliseKey(keyword);
    if (!token) return count;
    return normalizedTexts.includes(token) ? count + 1 : count;
  }, 0);
}

function highImpactProjectScore(project: NormalizedProject): number {
  const haystack = normaliseKey([
    project.title,
    project.description,
    project.highlights.join(' '),
    project.techStack.join(' '),
    project.keywords.join(' '),
  ].join(' '));
  const markers = [
    'production', 'deployed', 'scalable', 'real time', 'real-time', 'open source', 'open-source',
    'award', 'winner', 'published', 'used by', 'users', 'impact', 'featured', 'hackathon',
  ];
  const keywordHits = markers.some((marker) => haystack.includes(normaliseKey(marker)));
  const longProject = haystack.split(' ').length >= 25;
  const highImpactFlag = project.impactLevel === 'high' || project.deployed || keywordHits || longProject;
  return highImpactFlag ? 1 : 0;
}

function buildEvidenceGraph(student: NormalizedStudentProfile, job: NormalizedJobProfile): EvidenceGraph {
  const nodes: EvidenceNode[] = [
    { id: `student:${student.id}`, type: 'student', label: `${student.firstName} ${student.lastName}`.trim() },
  ];
  const edges: EvidenceEdge[] = [];

  for (const skill of student.skills) {
    nodes.push({ id: `skill:${skill.key}`, type: 'skill', label: skill.name });
    edges.push({ from: `student:${student.id}`, to: `skill:${skill.key}`, relation: 'HAS_SKILL' });
  }
  for (const course of student.coursesCompleted) {
    const courseId = `course:${normaliseKey(course.name)}`;
    nodes.push({ id: courseId, type: 'course', label: course.name });
    edges.push({ from: `student:${student.id}`, to: courseId, relation: 'COMPLETED' });
  }
  for (const cert of student.certifications) {
    const certId = `certificate:${normaliseKey(cert.name)}:${normaliseKey(cert.issuer)}`;
    const issuerId = `issuer:${cert.issuerKey}`;
    nodes.push({ id: certId, type: 'certificate', label: cert.name });
    nodes.push({ id: issuerId, type: 'issuer', label: cert.issuer });
    edges.push({ from: `student:${student.id}`, to: certId, relation: 'EARNED' });
  }
  for (const project of student.projects) {
    const projectId = `project:${normaliseKey(project.title)}`;
    nodes.push({ id: projectId, type: 'project', label: project.title });
    edges.push({ from: `student:${student.id}`, to: projectId, relation: 'BUILT' });
  }
  for (const skill of job.requiredSkills) {
    const skillId = `jobSkill:${normaliseKey(skill)}`;
    nodes.push({ id: skillId, type: 'jobSkill', label: skill });
    edges.push({ from: `student:${student.id}`, to: skillId, relation: 'REQUIRES' });
  }

  return { nodes, edges };
}

function detectDomain(skill: NormalizedSkill): string {
  if (skill.domain && skill.domain !== 'other') return skill.domain;
  const key = skill.key;
  if (['python', 'java', 'javascript', 'typescript', 'go', 'c', 'cpp'].includes(key)) return 'programming_language';
  if (['react', 'node', 'nestjs', 'django', 'spring', 'flask'].some((item) => key.includes(item))) return 'framework';
  if (['sql', 'postgres', 'mysql', 'mongodb', 'redis'].some((item) => key.includes(item))) return 'database';
  if (['aws', 'azure', 'gcp', 'docker', 'kubernetes'].some((item) => key.includes(item))) return 'cloud_devops';
  if (['ml', 'ai', 'machine learning', 'deep learning', 'nlp'].some((item) => key.includes(item))) return 'ai_ml';
  if (['communication', 'leadership', 'teamwork', 'presentation'].some((item) => key.includes(item))) return 'soft';
  return 'other';
}

function computeSkillCoverage(studentSkillSet: Set<string>, targetSkills: string[]): number {
  if (!targetSkills.length) return 0;
  const target = new Set(targetSkills.map(normaliseKey));
  return clamp01(intersectionSize(studentSkillSet, target) / Math.max(1, target.size));
}

function resolveMatchingCertificates(
  student: NormalizedStudentProfile,
  skillKey: string,
): NormalizedCertificate[] {
  const targetKey = normaliseKey(skillKey);
  return student.certifications.filter((cert) => {
    if (cert.skills.some((item) => item === targetKey)) return true;
    const haystack = normaliseKey([cert.name, cert.issuer, cert.description || '', cert.skills.join(' ')].join(' '));
    return haystack.includes(targetKey);
  });
}

export function computeTreSignals(
  student: NormalizedStudentProfile,
  eliteIssuers: Set<string>,
): TreSignals {
  const skilled = student.skills.filter((skill) => skill.proficiency >= 7);
  const uniqueDomains = new Set(student.skills.map((skill) => detectDomain(skill)));
  const eliteCerts = student.certifications.filter((cert) => !cert.forged && eliteIssuers.has(cert.issuerKey));
  const sigmaDepth = clamp01(skilled.length / 6);
  const sigmaBreadth = clamp01(uniqueDomains.size / 8);
  const sigmaElite = clamp01(eliteCerts.length / 3);
  const sigmaProj = clamp01(student.projects.filter((project) => highImpactProjectScore(project) > 0).length / 2);
  const sigmaComp = clamp01(
    countKeywordHits([student.projectText, student.achievementText, student.resumeSummary], COMPETITIVE_KEYWORDS) / 4,
  );
  const sigmaLead = clamp01(
    countKeywordHits([student.projectText, student.achievementText, student.resumeSummary], LEADERSHIP_KEYWORDS) / 3,
  );
  const openSourceHits = countKeywordHits([student.projectText, student.achievementText, student.resumeSummary], OPEN_SOURCE_KEYWORDS);
  const sigmaOs = clamp01(0.5 * (openSourceHits / 4) + 0.5 * student.githubActivity);

  return {
    sigmaDepth,
    sigmaBreadth,
    sigmaElite,
    sigmaProj,
    sigmaComp,
    sigmaLead,
    sigmaOs,
    gactivity: student.githubActivity,
  };
}

export function computeFeatureVector(
  student: NormalizedStudentProfile,
  job: NormalizedJobProfile,
  treSignals: TreSignals,
): { features: FeatureVector; warnings: string[]; bloomMetadataPresent: boolean } {
  const warnings: string[] = [];
  const studentSkills = new Set(student.skills.map((skill) => skill.key));
  const requiredSkills = new Set(job.requiredSkills.map(normaliseKey));
  const preferredSkills = new Set(job.preferredSkills.map(normaliseKey));
  const studentCorpus = tokenSet([
    student.resumeSummary,
    student.projectText,
    student.certificationText,
    student.achievementText,
    student.skills.map((skill) => skill.name).join(' '),
    student.projects.map((project) => `${project.title} ${project.description} ${project.highlights.join(' ')}`).join(' '),
  ].join(' '));
  const jobCorpus = tokenSet([
    job.rawJdText,
    job.title,
    job.requiredSkills.join(' '),
    job.preferredSkills.join(' '),
    job.softSkillsRequired.join(' '),
    job.preferredKeywords.join(' '),
  ].join(' '));

  const semanticOverlap = intersectionSize(studentCorpus, jobCorpus);
  const semanticDenominator = Math.sqrt(Math.max(1, studentCorpus.size) * Math.max(1, jobCorpus.size)) + 0.001;
  const fSem = clamp01((3.5 * semanticOverlap) / semanticDenominator);

  const requiredIntersection = intersectionSize(studentSkills, requiredSkills);
  const preferredIntersection = intersectionSize(studentSkills, preferredSkills);
  const fOverlap = clamp01(
    0.75 * requiredIntersection / Math.max(1, requiredSkills.size)
    + 0.25 * preferredIntersection / Math.max(1, preferredSkills.size),
  );

  const fProj = treSignals.sigmaProj;
  const fComp = treSignals.sigmaComp;
  const fSoft = treSignals.sigmaLead;
  const fOs = treSignals.sigmaOs;

  const fCurriculum = clamp01(
    intersectionSize(
      new Set(student.coursesCompleted.flatMap((course) => course.skills.map(normaliseKey))),
      requiredSkills,
    ) / Math.max(1, requiredSkills.size),
  );

  const proficiencyValues = student.skills.map((skill) => skill.proficiency);
  const fSelf = clamp01(mean(proficiencyValues, 0) / 10);

  const bloomValues = student.coursesCompleted
    .filter((course) => course.bloomLevel !== null && course.bloomLevel !== undefined)
    .filter((course) => course.skills.some((skill) => requiredSkills.has(normaliseKey(skill))))
    .map((course) => clamp01((course.bloomLevel ?? 0) / 6));
  const bloomMetadataPresent = bloomValues.length > 0;
  const fBloom = bloomMetadataPresent ? clamp01(mean(bloomValues, 0.5)) : 0.5;
  if (!bloomMetadataPresent) warnings.push('Missing course bloom metadata; neutral fallback applied for f_bloom.');

  const certificateTrustValues = student.certifications.map((cert) => cert.trust);
  const fTrust = student.certifications.length ? clamp01(mean(certificateTrustValues, 0)) : 0;

  const fCert = clamp01(
    [...requiredSkills].reduce((sum, skillKey) => {
      const matching = resolveMatchingCertificates(student, skillKey);
      const bestTrust = matching.length ? Math.max(...matching.map((cert) => cert.trust)) : 0;
      return sum + bestTrust;
    }, 0) / Math.max(1, requiredSkills.size),
  );

  const fGrowth = clamp01((0.45 * fSelf) + (0.35 * fCurriculum) + (0.2 * fProj));

  return {
    features: {
      fSem,
      fOverlap,
      fProj,
      fComp,
      fSoft,
      fOs,
      fCurriculum,
      fSelf,
      fBloom,
      fTrust,
      fCert,
      fGrowth,
      fGpa: student.fGpa,
      experienceFlag: student.experienceFlag ? 1 : 0,
    },
    warnings,
    bloomMetadataPresent,
  };
}

export function computeTreScore(treSignals: TreSignals): number {
  return clamp01(
    (TRE_WEIGHTS.depth * treSignals.sigmaDepth)
    + (TRE_WEIGHTS.proj * treSignals.sigmaProj)
    + (TRE_WEIGHTS.comp * treSignals.sigmaComp)
    + (TRE_WEIGHTS.breadth * treSignals.sigmaBreadth)
    + (TRE_WEIGHTS.elite * treSignals.sigmaElite)
    + (TRE_WEIGHTS.lead * treSignals.sigmaLead)
    + (TRE_WEIGHTS.os * treSignals.sigmaOs),
  );
}

export function computeFairnessAudit(rawScore: number, boost: number, gpaFeature: number): FairnessAudit {
  const boostedScore = clamp01(rawScore * boost);
  const wGpa = LTR_WEIGHTS.gpa;
  const yMaxGpa = clamp01((rawScore - wGpa * gpaFeature + wGpa) * boost);
  const gpaImpactAbs = Math.abs(yMaxGpa - boostedScore);
  const gpaImpactRel = gpaImpactAbs / Math.max(boostedScore, 1e-6);
  const classification: FairnessAudit['classification'] = gpaImpactRel < 0.02
    ? 'fair'
    : gpaImpactRel < 0.04
      ? 'minor_impact'
      : 'significant_impact';
  return {
    rawScore,
    boostedScore,
    yMaxGpa,
    gpaImpactAbs,
    gpaImpactRel,
    classification,
  };
}

function verdictFromScore(score: number): string {
  if (score >= 0.72) return 'Excellent Fit';
  if (score >= 0.58) return 'Good Fit';
  if (score >= 0.44) return 'Great Potential';
  if (score >= 0.3) return 'Hidden Talent';
  return 'Developing';
}

function shortlistFromVerdict(verdict: string): ShortlistStatus {
  switch (verdict) {
    case 'Excellent Fit':
      return ShortlistStatus.HIGHLY_RECOMMENDED;
    case 'Good Fit':
      return ShortlistStatus.RECOMMENDED;
    case 'Great Potential':
    case 'Hidden Talent':
      return ShortlistStatus.BORDERLINE;
    default:
      return ShortlistStatus.NOT_RECOMMENDED;
  }
}

function roundPercent(value: number): number {
  return Math.round(clamp01(value) * 100);
}

function normalizeCgpaTo4(value?: number | null): number | null {
  if (value === null || value === undefined) return null;
  return value > 4.5 ? (value * 4) / 10 : value;
}

export function compareCandidateScores(a: CandidateComparatorRecord, b: CandidateComparatorRecord): number {
  if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
  if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
  if (b.overlap !== a.overlap) return b.overlap - a.overlap;
  if (b.treScore !== a.treScore) return b.treScore - a.treScore;
  return a.id.localeCompare(b.id);
}

export function scoreCandidate(
  studentRaw: RawStudentProfile,
  jobRaw: RawJobProfile,
  options: HsgmScoringOptions = {},
): CandidateScore {
  const student = normaliseStudentProfile(studentRaw);
  const job = normaliseJobProfile(jobRaw);

  const eliteIssuers = new Set((options.eliteIssuers ?? Array.from(DEFAULT_ELITE_ISSUERS)).map(normaliseKey));
  student.certifications = student.certifications.map((cert) => ({
    ...cert,
    trust: scoreCertificateTrust(cert, eliteIssuers),
  }));

  const treSignals = computeTreSignals(student, eliteIssuers);
  const treScore = computeTreScore(treSignals);
  const { features, warnings: featureWarnings, bloomMetadataPresent } = computeFeatureVector(student, job, treSignals);

  const boost = student.gpaOn4 < 3.0 && treScore >= 0.6 ? 1.12 : 1.0;

  const rawScore = (
    (LTR_WEIGHTS.semantic * features.fSem)
    + (LTR_WEIGHTS.overlap * features.fOverlap)
    + (LTR_WEIGHTS.tre * treScore)
    + (LTR_WEIGHTS.certRelevance * features.fCert)
    + (LTR_WEIGHTS.projectImpact * features.fProj)
    + (LTR_WEIGHTS.competitive * features.fComp)
    + (LTR_WEIGHTS.growth * features.fGrowth)
    + (LTR_WEIGHTS.trust * features.fTrust)
    + (LTR_WEIGHTS.curriculumCoverage * features.fCurriculum)
    + (LTR_WEIGHTS.softSkills * features.fSoft)
    + (LTR_WEIGHTS.openSource * features.fOs)
    + (LTR_WEIGHTS.gpa * features.fGpa)
    + (LTR_WEIGHTS.selfAssessment * features.fSelf)
    + (LTR_WEIGHTS.bloomLevel * features.fBloom)
    + (LTR_WEIGHTS.experienceFlag * features.experienceFlag)
  );

  const fairnessAudit = computeFairnessAudit(rawScore, boost, features.fGpa);
  const finalScore = fairnessAudit.boostedScore;
  const verdict = verdictFromScore(finalScore);
  const badges: string[] = [];
  const hiddenTalentFlag = student.gpaOn4 < 3.0 && treScore >= 0.6;
  if (hiddenTalentFlag) badges.push('Hidden Talent Detected');
  if (treSignals.sigmaComp > 0.5) badges.push('Competitive Achiever');
  if (treSignals.sigmaOs > 0.5) badges.push('Active Open Source Contributor');
  if (treSignals.sigmaLead > 0.4) badges.push('Demonstrated Leadership');
  if (features.fProj > 0.6) badges.push('Strong Project Portfolio');
  if (features.fGrowth > 0.7) badges.push('High Growth Trajectory');

  const requiredSkills = new Set(job.requiredSkills.map(normaliseKey));
  const preferredSkills = new Set(job.preferredSkills.map(normaliseKey));
  const studentSkills = new Set(student.skills.map((skill) => skill.key));
  const matchedSkills = [...student.skills]
    .filter((skill) => requiredSkills.has(skill.key) || preferredSkills.has(skill.key))
    .map((skill) => ({
      skillName: skill.name,
      confidence: skill.confidence ?? 'MEDIUM',
      matchType: 'explicit' as const,
      jobSkillType: requiredSkills.has(skill.key) ? 'required' as const : 'preferred' as const,
      importance: requiredSkills.has(skill.key) ? 1 : 0.5,
    }));

  const inferredMatchedSkills: CandidateScore['inferredMatchedSkills'] = [];
  const missingSkills = [...requiredSkills].filter((skill) => !studentSkills.has(skill));
  const matchedSoftSkills = job.softSkillsRequired.filter((skill) => student.softSkills.includes(normaliseKey(skill)));

  const eligibilityReasons: string[] = [];
  let eligibilityStatus: EligibilityStatus = EligibilityStatus.ELIGIBLE;
  const jobMinCgpaOn4 = normalizeCgpaTo4(job.minCgpa);
  if (jobMinCgpaOn4 !== null) {
    if (student.rawGpaScale > 0 && student.rawGpa * 4 / student.rawGpaScale < 3.0 && jobMinCgpaOn4 > 3.0) {
      eligibilityReasons.push('GPA_BELOW_MULTIPLIER_THRESHOLD');
    }
    if (student.gpaOn4 < jobMinCgpaOn4) {
      eligibilityReasons.push('CGPA_BELOW_CUTOFF');
      eligibilityStatus = EligibilityStatus.PARTIALLY_ELIGIBLE;
    }
  }
  if (job.maxBacklogs !== null && job.maxBacklogs !== undefined && student.activeBacklogs > job.maxBacklogs) {
    eligibilityReasons.push('BACKLOGS_EXCEEDED');
    eligibilityStatus = EligibilityStatus.INELIGIBLE;
  }
  if (job.allowedGraduationYears.length && student.expectedGraduationYear && !job.allowedGraduationYears.includes(student.expectedGraduationYear)) {
    eligibilityReasons.push('GRAD_YEAR_MISMATCH');
    eligibilityStatus = EligibilityStatus.INELIGIBLE;
  }

  if (!eligibilityReasons.length) eligibilityReasons.push('ELIGIBILITY_OK');

  const summaryBits = [
    `Final score ${roundPercent(finalScore)}% (${verdict})`,
    `TRE ${Math.round(treScore * 100)}%`,
    hiddenTalentFlag ? 'hidden talent multiplier applied' : 'no GPA multiplier',
  ];

  const explanation: ScoreExplanation = {
    summary: summaryBits.join(' | '),
    reasonCodes: [
      ...new Set([
        verdict.replace(/\s+/g, '_').toUpperCase(),
        hiddenTalentFlag ? 'HIDDEN_TALENT' : 'NO_HIDDEN_TALENT',
        boost > 1 ? 'BOOST_APPLIED' : 'BOOST_SKIPPED',
        ...badges.map((badge) => normaliseKey(badge).replace(/\s+/g, '_').toUpperCase()),
      ]),
    ],
    highlights: [
      `Semantic overlap: ${roundPercent(features.fSem)}%`,
      `Required skill coverage: ${roundPercent(features.fOverlap)}%`,
      `Certificate trust relevance: ${roundPercent(features.fCert)}%`,
    ],
    warnings: [
      ...featureWarnings,
      ...(bloomMetadataPresent ? [] : ['Neutral bloom fallback used.']),
    ],
    featureBreakdown: [
      { key: 'fSem', label: 'Semantic fit', value: features.fSem, weight: LTR_WEIGHTS.semantic },
      { key: 'fOverlap', label: 'Skill overlap', value: features.fOverlap, weight: LTR_WEIGHTS.overlap },
      { key: 'tre', label: 'TRE', value: treScore, weight: LTR_WEIGHTS.tre },
      { key: 'fCert', label: 'Certificate relevance', value: features.fCert, weight: LTR_WEIGHTS.certRelevance },
      { key: 'fProj', label: 'Project impact', value: features.fProj, weight: LTR_WEIGHTS.projectImpact },
      { key: 'fComp', label: 'Competitive profile', value: features.fComp, weight: LTR_WEIGHTS.competitive },
      { key: 'fGrowth', label: 'Growth', value: features.fGrowth, weight: LTR_WEIGHTS.growth },
      { key: 'fTrust', label: 'Trust', value: features.fTrust, weight: LTR_WEIGHTS.trust },
      { key: 'fCurriculum', label: 'Curriculum coverage', value: features.fCurriculum, weight: LTR_WEIGHTS.curriculumCoverage },
      { key: 'fSoft', label: 'Soft skills', value: features.fSoft, weight: LTR_WEIGHTS.softSkills },
      { key: 'fOs', label: 'Open source', value: features.fOs, weight: LTR_WEIGHTS.openSource },
      { key: 'fGpa', label: 'GPA', value: features.fGpa, weight: LTR_WEIGHTS.gpa },
      { key: 'fSelf', label: 'Self assessment', value: features.fSelf, weight: LTR_WEIGHTS.selfAssessment },
      { key: 'fBloom', label: 'Bloom level', value: features.fBloom, weight: LTR_WEIGHTS.bloomLevel },
    ],
    evidenceGraph: buildEvidenceGraph(student, job),
  };

  return {
    studentProfileId: student.id,
    jobId: job.id,
    finalScore,
    rawScore,
    overlap: roundPercent(features.fOverlap),
    boost,
    treScore,
    verdict,
    badges,
    eligibilityStatus,
    eligibilityReasons,
    features,
    treSignals,
    fairnessAudit,
    explanation,
    warnings: explanation.warnings,
    semanticSimilarity: roundPercent(features.fSem),
    requiredSkillCoverage: roundPercent(features.fOverlap),
    preferredSkillCoverage: roundPercent(computeSkillCoverage(studentSkills, job.preferredSkills)),
    projectRelevance: roundPercent(features.fProj),
    certificationRelevance: roundPercent(features.fCert),
    academicFit: roundPercent(features.fGpa),
    softSkillScore: roundPercent(features.fSoft),
    majorAlignmentScore: roundPercent(features.fCurriculum),
    experienceLevelScore: roundPercent(features.fProj),
    domainAlignmentScore: roundPercent(features.fSem),
    bonusScore: roundPercent(features.fTrust),
    hiddenTalentFlag,
    biasAdjusted: boost > 1,
    recommendation: shortlistFromVerdict(verdict),
    matchedSkills,
    inferredMatchedSkills,
    missingSkills,
    matchedSoftSkills,
    reasonCodes: explanation.reasonCodes,
    reasonSummary: explanation.summary,
    gpaOn4: student.gpaOn4,
    rawGpa: student.rawGpa,
    rawGpaScale: student.rawGpaScale,
  };
}

export function buildHsgmBatchResults(results: CandidateScore[]): HsgmRankingResult {
  return {
    scores: [...results]
      .map((result, index) => ({ ...result, id: result.studentProfileId || `row-${index}` }))
      .sort((a, b) => compareCandidateScores(a, b)),
  };
}
