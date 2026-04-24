import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { SkillCategory, SkillConfidence, EligibilityStatus, ShortlistStatus, AchievementType, JobType, ApplicationStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  return format(new Date(date), fmt);
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCTC(min?: number, max?: number, currency = 'INR') {
  if (!min && !max) return 'Undisclosed';
  const fmt = (n: number) => `${n} LPA`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function getMatchColor(score: number): string {
  if (score >= 70) return 'text-match-high';
  if (score >= 40) return 'text-match-medium';
  return 'text-match-low';
}

export function getMatchBg(score: number): string {
  if (score >= 70) return 'bg-match-high-bg text-match-high';
  if (score >= 40) return 'bg-match-medium-bg text-match-medium';
  return 'bg-match-low-bg text-match-low';
}

export function getEligibilityColor(status: EligibilityStatus): string {
  switch (status) {
    case 'ELIGIBLE': return 'text-match-high bg-match-high-bg';
    case 'PARTIALLY_ELIGIBLE': return 'text-match-medium bg-match-medium-bg';
    case 'INELIGIBLE': return 'text-match-low bg-match-low-bg';
  }
}

export function getRecommendationColor(rec: ShortlistStatus): string {
  switch (rec) {
    case 'HIGHLY_RECOMMENDED': return 'bg-green-100 text-green-800';
    case 'RECOMMENDED': return 'bg-blue-100 text-blue-800';
    case 'BORDERLINE': return 'bg-amber-100 text-amber-800';
    case 'NOT_RECOMMENDED': return 'bg-red-100 text-red-800';
  }
}

export function getConfidenceColor(conf: SkillConfidence): string {
  switch (conf) {
    case 'HIGH': return 'bg-brand-oxford/10 text-brand-oxford border-brand-oxford/20';
    case 'MEDIUM': return 'bg-brand-tan-100 text-brand-oxford-400 border-brand-tan-300';
    case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getCategoryIcon(category: SkillCategory): string {
  const icons: Record<SkillCategory, string> = {
    PROGRAMMING_LANGUAGE: '{ }',
    FRAMEWORK_LIBRARY: '⚙️',
    DATABASE: '🗄️',
    CLOUD_DEVOPS: '☁️',
    AI_ML: '🧠',
    DATA_ANALYTICS: '📊',
    CS_FUNDAMENTALS: '🔬',
    SOFT_SKILLS: '💬',
    DOMAIN_SKILLS: '🎯',
    TOOLS_PLATFORMS: '🛠️',
    OTHER: '◆',
  };
  return icons[category] || '◆';
}

export function getAchievementTypeLabel(type: AchievementType): string {
  const labels: Record<AchievementType, string> = {
    HACKATHON: 'Hackathon',
    INTERNSHIP: 'Internship',
    PROJECT: 'Project',
    RESEARCH_PAPER: 'Research Paper',
    CERTIFICATION: 'Certification',
    CLUB_LEADERSHIP: 'Club & Leadership',
    AWARD: 'Award',
    WORKSHOP: 'Workshop',
    TECHNICAL_EVENT: 'Technical Event',
    VOLUNTEERING: 'Volunteering',
    OTHER: 'Other',
  };
  return labels[type] || type;
}

export function getJobTypeLabel(type: JobType): string {
  const labels: Record<JobType, string> = {
    FULL_TIME: 'Full Time',
    INTERNSHIP: 'Internship',
    CONTRACT: 'Contract',
    PART_TIME: 'Part Time',
  };
  return labels[type] || type;
}

export function getApplicationStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    APPLIED: 'Applied',
    UNDER_REVIEW: 'Under Review',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    SELECTED: 'Selected',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
  };
  return labels[status] || status;
}

export function getApplicationStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'SELECTED': return 'bg-green-100 text-green-800';
    case 'SHORTLISTED':
    case 'INTERVIEW_SCHEDULED': return 'bg-blue-100 text-blue-800';
    case 'APPLIED':
    case 'UNDER_REVIEW': return 'bg-amber-100 text-amber-800';
    case 'REJECTED': return 'bg-red-100 text-red-800';
    case 'WITHDRAWN': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function initials(firstName: string, lastName?: string): string {
  return `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type MatchLike = {
  id: string;
  studentProfileId?: string | null;
  studentProfile?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  overallMatchPercentage?: number | null;
};

function getMatchStudentKey(match: MatchLike): string {
  if (match.studentProfileId) return match.studentProfileId;
  if (match.studentProfile?.id) return match.studentProfile.id;
  const firstName = match.studentProfile?.firstName?.trim() ?? '';
  const lastName = match.studentProfile?.lastName?.trim() ?? '';
  if (firstName || lastName) return `${firstName} ${lastName}`.trim().toLowerCase();
  return match.id;
}

export function dedupeMatchResultsByStudent<T extends MatchLike>(matches: T[]): T[] {
  const ranked = [...matches].sort((a, b) => (b.overallMatchPercentage ?? 0) - (a.overallMatchPercentage ?? 0));
  const seen = new Set<string>();

  return ranked.filter(match => {
    const key = getMatchStudentKey(match);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
