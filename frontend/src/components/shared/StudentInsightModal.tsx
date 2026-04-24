import { X, GraduationCap, Briefcase, Award, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MatchResult, StudentProfile } from '@/types';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';

interface StudentInsightModalProps {
  open: boolean;
  onClose: () => void;
  student: Partial<Pick<StudentProfile, 'firstName' | 'lastName' | 'department' | 'cgpa' | 'gpaScale' | 'activeBacklogs' | 'profileCompleteness' | 'studentSkills' | 'projects' | 'certifications' | 'expectedGraduationYear'>> & {
    email?: string;
    usn?: string;
  };
  match?: MatchResult | null;
  title: string;
  subtitle?: string;
}

function SectionTitle({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-brand-oxford" />
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
    </div>
  );
}

function formatPercent(value?: number) {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

export default function StudentInsightModal({ open, onClose, student, match, title, subtitle }: StudentInsightModalProps) {
  if (!open) return null;

  const skillsCount = student.studentSkills?.length ?? 0;
  const projectsCount = student.projects?.length ?? 0;
  const certCount = student.certifications?.length ?? 0;
  const fitReasons = match?.eligibilityReasons ?? [];

  const computedSignals = [
    student.cgpa != null ? `CGPA ${student.cgpa}${student.gpaScale && student.gpaScale !== 10 ? ` / ${student.gpaScale}` : ''}` : 'CGPA not provided',
    (student.activeBacklogs ?? 0) > 0 ? `${student.activeBacklogs} active backlog(s)` : 'No active backlogs',
    `${skillsCount} skill${skillsCount === 1 ? '' : 's'} listed`,
    `${projectsCount} project${projectsCount === 1 ? '' : 's'} and ${certCount} certification${certCount === 1 ? '' : 's'}`,
  ];

  const partialHint = match?.eligibilityStatus === 'PARTIALLY_ELIGIBLE'
    ? 'This profile is partially eligible because one or more hard filters are not fully satisfied, but the rest of the profile still looks promising.'
    : (student.activeBacklogs ?? 0) > 0
      ? 'This profile is partially eligible because the backlog count is not zero.'
      : (student.profileCompleteness ?? 0) < 70
        ? 'This profile is partially eligible because the profile is still incomplete.'
        : 'This profile is currently being screened against the job rules.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="text-sm font-black text-brand-oxford">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: 'CGPA', value: student.cgpa ?? '—' },
              { label: 'Backlogs', value: student.activeBacklogs ?? 0 },
              { label: 'Skills', value: skillsCount },
              { label: 'Completeness', value: formatPercent(student.profileCompleteness) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-gray-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-black text-brand-oxford">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <SectionTitle icon={GraduationCap} title="Profile snapshot" />
              <div className="space-y-2 text-sm text-foreground">
                <p className="font-semibold">{student.firstName} {student.lastName}</p>
                <p className="text-xs text-muted-foreground">{student.department} {student.expectedGraduationYear ? `· ${student.expectedGraduationYear}` : ''}</p>
                {student.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                {student.usn && <p className="text-xs text-muted-foreground">USN {student.usn}</p>}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {computedSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3">
              <SectionTitle icon={AlertCircle} title="Why this is partial" />
              <p className="text-sm text-muted-foreground leading-relaxed">{partialHint}</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {(fitReasons.length > 0 ? fitReasons : ['Job-specific match details will appear once a match is computed.']).map((reason) => (
                  <div key={reason} className="flex items-start gap-2">
                    <ShieldAlert className={cn('w-3.5 h-3.5 mt-0.5', match?.eligibilityStatus === 'ELIGIBLE' ? 'text-emerald-500' : 'text-amber-500')} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {match && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <SectionTitle icon={Briefcase} title="Match summary" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold">{match.job?.title ?? 'Job match'}</p>
                  <p className="text-xs text-muted-foreground">{match.job?.company?.name ?? ''}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{match.reasonSummary}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <SectionTitle icon={Award} title="Score evidence" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-muted-foreground">Overall</p>
                    <p className="mt-1 font-black text-brand-oxford">{match.overallMatchPercentage}%</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-muted-foreground">Skills</p>
                    <p className="mt-1 font-black text-brand-oxford">{formatPercent(match.requiredSkillCoverage)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-muted-foreground">Academic</p>
                    <p className="mt-1 font-black text-brand-oxford">{formatPercent(match.academicFit)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-muted-foreground">Projects</p>
                    <p className="mt-1 font-black text-brand-oxford">{formatPercent(match.projectRelevance)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
