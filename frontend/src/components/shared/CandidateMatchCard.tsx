import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchResult } from '@/types';
import MatchScoreBadge from './MatchScoreBadge';
import EligibilityBadge from './EligibilityBadge';
import SkillChip from './SkillChip';

function MiniScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{Math.round(value)}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface CandidateMatchCardProps {
  match: MatchResult;
  onShortlist?: () => void;
  onView?: () => void;
  isShortlisted?: boolean;
  className?: string;
}

export default function CandidateMatchCard({ match, onShortlist, onView, isShortlisted, className }: CandidateMatchCardProps) {
  const profile = match.studentProfile;
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';

  return (
    <div className={cn('bg-white rounded-2xl border border-border shadow-card p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-oxford/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-oxford">
              {displayName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {match.job?.title ?? 'Matched role'}
              {match.job?.company?.name ? ` - ${match.job.company.name}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{profile?.department ?? ''} - {profile?.expectedGraduationYear}</p>
          </div>
        </div>
        <MatchScoreBadge score={match.overallMatchPercentage} showBar />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <EligibilityBadge status={match.eligibilityStatus} />
        {profile?.cgpa && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <GraduationCap className="w-3 h-3" />CGPA {profile.cgpa}
          </span>
        )}
      </div>

      {match.matchedSkills && match.matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {match.matchedSkills.slice(0, 4).map((s, i) => (
            <SkillChip key={i} name={s.skillName} variant="matched" />
          ))}
          {match.matchedSkills.length > 4 && (
            <span className="text-[11px] text-muted-foreground self-center">+{match.matchedSkills.length - 4}</span>
          )}
        </div>
      )}

      {/* Score breakdown bars */}
      <div className="mt-3 space-y-1.5">
        <MiniScoreBar label="Skills" value={match.requiredSkillCoverage} color="bg-brand-oxford" />
        <MiniScoreBar label="Academic" value={match.academicFit} color="bg-green-500" />
        <MiniScoreBar label="Projects" value={match.projectRelevance} color="bg-amber-500" />
      </div>

      {match.reasonSummary && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">{match.reasonSummary}</p>
      )}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 text-xs font-semibold text-brand-oxford border border-brand-oxford/30 hover:bg-brand-oxford/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            View Profile
          </button>
        )}
        {onShortlist && (
          <button
            onClick={onShortlist}
            className={cn(
              'flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
              isShortlisted
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-brand-oxford text-white hover:bg-brand-oxford/90',
            )}
          >
            {isShortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
        )}
      </div>
    </div>
  );
}

