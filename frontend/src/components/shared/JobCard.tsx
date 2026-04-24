import { useState } from 'react';
import { Building2, MapPin, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Job } from '@/types';
import MatchScoreBadge from './MatchScoreBadge';
import EligibilityBadge from './EligibilityBadge';
import SkillChip from './SkillChip';

interface JobCardProps {
  job: Job;
  matchScore?: number;
  eligibility?: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'INELIGIBLE';
  onClick?: () => void;
  onApply?: () => void;
  isApplied?: boolean;
  isApplying?: boolean;
  compact?: boolean;
  className?: string;
}

export default function JobCard({
  job, matchScore, eligibility, onClick, onApply, isApplied = false, isApplying = false, compact, className,
}: JobCardProps) {
  const requiredSkills = job.jobSkills?.filter(s => s.type === 'REQUIRED') ?? [];
  const hasDescription = !!(job.description || (job as any).rawJdText);
  const [showDesc, setShowDesc] = useState(false);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-border shadow-card p-5 transition-all hover:shadow-md hover:border-brand-oxford/20',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-oxford/6 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-brand-oxford" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{job.company?.name}</p>
          </div>
        </div>
        {matchScore !== undefined && <MatchScoreBadge score={matchScore} size="sm" />}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
        {job.location && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />{job.location}
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />{job.jobType.replace('_', ' ')}
          </span>
        )}
        {job._count?.applications != null && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="w-3 h-3" />{job._count.applications} applicants
          </span>
        )}
        {job.ctcMin != null && job.ctcMax != null && (
          <span className="text-[11px] font-semibold text-brand-oxford">
            ₹{job.ctcMin}–{job.ctcMax} LPA
          </span>
        )}
      </div>

      {!compact && requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {requiredSkills.slice(0, 5).map(s => (
            <SkillChip key={s.skillId} name={s.skill?.name ?? s.skillId} variant="outline" />
          ))}
          {requiredSkills.length > 5 && (
            <span className="text-[11px] text-muted-foreground self-center">+{requiredSkills.length - 5}</span>
          )}
        </div>
      )}

      {/* Expandable JD */}
      {showDesc && hasDescription && (
        <div className="mt-3 px-3 py-3 bg-gray-50 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
          {(job as any).rawJdText || job.description}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {eligibility && <EligibilityBadge status={eligibility} />}
          {job.applicationDeadline && (
            <span className="text-[11px] text-muted-foreground">
              Due {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {hasDescription && (
            <button
              onClick={e => { e.stopPropagation(); setShowDesc(v => !v); }}
              className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-brand-oxford transition-colors"
            >
              {showDesc ? <><ChevronUp className="w-3 h-3" /> Hide JD</> : <><ChevronDown className="w-3 h-3" /> View JD</>}
            </button>
          )}
        </div>
        {onApply && (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            disabled={isApplied || isApplying}
            className="text-xs font-semibold text-white bg-brand-oxford hover:bg-brand-oxford-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isApplying ? 'Applying…' : isApplied ? 'Applied' : 'Apply'}
          </button>
        )}
      </div>
    </div>
  );
}
