/**
 * Admin -- AI Matching Engine
 * HSGM-aligned match review:
 *   Score = semantic + overlap + TRE + certificate relevance + curriculum + trust
 *
 * Features: explainable ranking Â· bias audit Â· hidden talent detection Â· feature breakdown
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Target, Zap, TrendingUp, Users, ChevronDown, ChevronUp,
  Play, RefreshCw, CheckCircle, Award, AlertTriangle, Sparkles,
  BookOpen, Layers, BarChart3, ShieldCheck,
} from 'lucide-react';
import { useAdminJobs, useAdminRunMatching, useMatchResults } from '@/hooks/api';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Recommendation = 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'BORDERLINE' | 'NOT_RECOMMENDED';
type Tab = 'ALL' | Recommendation;

interface MatchData {
  id: string;
  studentProfileId: string;
  jobId: string;
  studentProfile?: { id: string; firstName: string; lastName: string; department: string; cgpa?: number; expectedGraduationYear?: number };
  eligibilityStatus: string;
  eligibilityReasons: string[];
  overallMatchPercentage: number;
  requiredSkillCoverage: number;
  preferredSkillCoverage: number;
  semanticSimilarity: number;
  treScore?: number;
  academicFit: number;
  projectRelevance: number;
  certificationRelevance: number;
  majorAlignmentScore?: number;
  experienceLevelScore?: number;
  domainAlignmentScore?: number;
  bonusScore?: number;
  hiddenTalentFlag?: boolean;
  biasAdjusted?: boolean;
  weightProfile?: string;
  fuzzySkillMatches?: Array<{ jobSkill: string; matchedWith: string; similarity: number; partialScore: number; path?: string[]; hops?: number }>;
  matchedSkills: Array<{ skillName: string; confidence: string; matchType: string; jobSkillType: string; importance: number }>;
  inferredMatchedSkills?: Array<{ skillName: string; confidence: string; matchType: string; jobSkillType: string; importance: number }>;
  missingSkills: string[];
  matchedSoftSkills?: string[];
  recommendation: Recommendation;
  reasonCodes: string[];
  reasonSummary?: string;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RECOMMENDATION_CONFIG: Record<Recommendation, { label: string; color: string; bg: string; border: string; dot: string }> = {
  HIGHLY_RECOMMENDED: { label: 'Highly Recommended', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  RECOMMENDED:        { label: 'Recommended',         color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  BORDERLINE:         { label: 'Borderline',           color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  NOT_RECOMMENDED:    { label: 'Not Recommended',      color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400'    },
};

const ELIGIBILITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ELIGIBLE:           { label: 'Eligible',         color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
  PARTIALLY_ELIGIBLE: { label: 'Partial',          color: 'text-amber-700',   bg: 'bg-amber-50 border border-amber-200'    },
  INELIGIBLE:         { label: 'Ineligible',       color: 'text-red-700',     bg: 'bg-red-50 border border-red-200'        },
};

const SCORE_COLORS = {
  skill:      'bg-brand-oxford',
  major:      'bg-indigo-500',
  experience: 'bg-amber-500',
  domain:     'bg-teal-500',
  academic:   'bg-green-500',
  bonus:      'bg-purple-500',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'HIGHLY_RECOMMENDED', label: 'Highly Recommended' },
  { key: 'RECOMMENDED', label: 'Recommended' },
  { key: 'BORDERLINE', label: 'Borderline' },
  { key: 'NOT_RECOMMENDED', label: 'Not Recommended' },
];

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 75 ? '#10b981' : score >= 58 ? '#3b82f6' : score >= 38 ? '#f59e0b' : '#9ca3af';
  const dim = size === 'lg' ? 72 : size === 'md' ? 54 : 40;
  const r = (dim - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={dim} height={dim} className="flex-shrink-0 -rotate-90">
      <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size === 'lg' ? 6 : 5} />
      <circle
        cx={dim / 2} cy={dim / 2} r={r} fill="none"
        stroke={color} strokeWidth={size === 'lg' ? 6 : 5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={dim / 2} y={dim / 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size === 'lg' ? 14 : size === 'md' ? 12 : 10}
        fontWeight="700" transform={`rotate(90, ${dim / 2}, ${dim / 2})`}
      >
        {score}%
      </text>
    </svg>
  );
}

function MiniBar({ label, value, colorClass, icon }: { label: string; value: number; colorClass: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-muted-foreground flex-shrink-0">{icon}</span>
          <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        </div>
        <span className="text-[10px] font-bold text-foreground flex-shrink-0">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          className={cn('h-full rounded-full', colorClass)}
        />
      </div>
    </div>
  );
}

function SkillPill({ name, variant }: { name: string; variant: 'matched' | 'fuzzy' | 'missing' | 'soft' }) {
  const styles = {
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    fuzzy:   'bg-teal-50 text-teal-700 border-teal-200',
    missing: 'bg-red-50 text-red-700 border-red-200',
    soft:    'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md border', styles[variant])}>
      {variant === 'fuzzy' ? 'â‰ˆ ' : ''}{name}
    </span>
  );
}

function ExpandedBreakdown({ match }: { match: MatchData }) {
  const treScore = (match.treScore ?? 0) * 100;
  const trustScore = match.bonusScore ?? match.certificationRelevance;
  const semanticScore = match.semanticSimilarity;
  const overlapScore = match.requiredSkillCoverage;
  const gpaScore = match.academicFit;
  const curriculumScore = match.majorAlignmentScore ?? 0;
  const projectScore = match.projectRelevance;
  const fuzzy = match.fuzzySkillMatches ?? [];
  const inferred = match.inferredMatchedSkills ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-4 border-t border-border space-y-4">
        {/* HSGM feature bars */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            HSGM Feature Breakdown
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0"><Zap className="w-3 h-3" /></span>
                  <span className="text-[11px] font-semibold text-foreground truncate">Required Skill Coverage</span>
                </div>
                <span className="text-[11px] font-bold text-foreground flex-shrink-0">{Math.round(overlapScore)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(overlapScore, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className={cn('h-full rounded-full', SCORE_COLORS.skill)} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Direct overlap with required JD skills.</p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0"><BookOpen className="w-3 h-3" /></span>
                  <span className="text-[11px] font-semibold text-foreground truncate">Semantic Fit</span>
                </div>
                <span className="text-[11px] font-bold text-foreground flex-shrink-0">{Math.round(semanticScore)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(semanticScore, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className={cn('h-full rounded-full', SCORE_COLORS.domain)} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Resume and JD meaning similarity.</p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0"><TrendingUp className="w-3 h-3" /></span>
                  <span className="text-[11px] font-semibold text-foreground truncate">TRE</span>
                </div>
                <span className="text-[11px] font-bold text-foreground flex-shrink-0">{Math.round(treScore)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(treScore, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className={cn('h-full rounded-full', SCORE_COLORS.experience)} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Trajectory from projects, competitions, leadership, and open source.</p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0"><BarChart3 className="w-3 h-3" /></span>
                  <span className="text-[11px] font-semibold text-foreground truncate">GPA</span>
                </div>
                <span className="text-[11px] font-bold text-foreground flex-shrink-0">{Math.round(gpaScore)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(gpaScore, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className={cn('h-full rounded-full', SCORE_COLORS.academic)} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Normalized academic signal on the display scale.</p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0"><Award className="w-3 h-3" /></span>
                  <span className="text-[11px] font-semibold text-foreground truncate">Certificate Trust</span>
                </div>
                <span className="text-[11px] font-bold text-foreground flex-shrink-0">{Math.round(trustScore)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(trustScore, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className={cn('h-full rounded-full', SCORE_COLORS.bonus)} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Trust-weighted certificate relevance, not a binary flag.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-muted-foreground">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <span className="font-semibold text-foreground">Curriculum coverage:</span> {Math.round(curriculumScore)}%
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <span className="font-semibold text-foreground">Project relevance:</span> {Math.round(projectScore)}%
            </div>
          </div>
        </div>

        {/* Graph fuzzy skill matches with traversal path */}
        {fuzzy.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
              <Brain className="w-3 h-3 text-teal-600" /> Knowledge Graph Matches
            </p>
            <div className="space-y-1.5">
              {fuzzy.map((f, i) => {
                const hopLabel = f.hops === 0 ? 'exact' : f.hops === 1 ? '1-hop' : f.hops === 2 ? '2-hop' : '3-hop';
                const hopColor = f.hops === 1 ? 'text-teal-600' : f.hops === 2 ? 'text-indigo-600' : 'text-purple-600';
                return (
                  <div key={i} className="flex flex-wrap items-center gap-1 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
                    {/* Graph path visualization */}
                    {f.path && f.path.length > 1 ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-mono text-teal-800">
                        {f.path.map((node, ni) => (
                          <span key={ni} className="flex items-center gap-0.5">
                            <span className="bg-white border border-teal-300 px-1 py-0.5 rounded text-[9px] font-bold">{node}</span>
                            {ni < f.path!.length - 1 && <span className="text-teal-400 text-[9px]">â†’</span>}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-teal-800">
                        {f.jobSkill} â‰ˆ {f.matchedWith}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold ml-1 ${hopColor}`}>
                      {Math.round(f.similarity * 100)}% Â· {hopLabel}
                    </span>
                    <span className="text-[9px] text-muted-foreground">+{f.partialScore.toFixed(1)}pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Matched skills */}
        {match.matchedSkills.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Matched Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {match.matchedSkills.map((s, i) => <SkillPill key={i} name={s.skillName} variant="matched" />)}
              {inferred.map((s, i) => <SkillPill key={`inf-${i}`} name={s.skillName} variant="fuzzy" />)}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {match.missingSkills.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Missing Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((s, i) => <SkillPill key={i} name={s} variant="missing" />)}
            </div>
          </div>
        )}

        {/* Soft skills */}
        {(match.matchedSoftSkills ?? []).length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Soft Skills Detected</p>
            <div className="flex flex-wrap gap-1.5">
              {(match.matchedSoftSkills ?? []).map((s, i) => <SkillPill key={i} name={s} variant="soft" />)}
            </div>
          </div>
        )}

        {/* AI summary */}
        {match.reasonSummary && (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-foreground mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3 text-brand-oxford" /> Algorithm Explanation
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{match.reasonSummary}</p>
          </div>
        )}

        {/* Eligibility reasons */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Eligibility Check</p>
          <div className="space-y-1">
            {match.eligibilityReasons.map((r, i) => {
              const ok = r.includes('_OK') || r.includes('BIAS_MITIGATION');
              const partial = r.includes('PARTIAL') || r.includes('PARTIALLY');
              return (
                <div key={i} className="flex items-start gap-1.5">
                  <span className={cn('text-[10px] mt-0.5', ok ? 'text-emerald-500' : partial ? 'text-amber-500' : 'text-red-500')}>
                    {ok ? 'âœ“' : partial ? 'âš ' : 'âœ—'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CandidateRow({ match, rank }: { match: MatchData; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const recCfg   = RECOMMENDATION_CONFIG[match.recommendation] ?? RECOMMENDATION_CONFIG.NOT_RECOMMENDED;
  const eligCfg  = ELIGIBILITY_CONFIG[match.eligibilityStatus] ?? ELIGIBILITY_CONFIG.INELIGIBLE;
  const student  = match.studentProfile;
  const treScore = (match.treScore ?? 0) * 100;
  const trustScore = match.bonusScore ?? match.certificationRelevance;
  const semanticScore = match.semanticSimilarity;
  const overlapScore = match.requiredSkillCoverage;
  const gpaScore = match.academicFit;
  const projectScore = match.projectRelevance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.05, 0.3) }}
      className={cn(
        'rounded-2xl border-2 p-4 transition-all hover:shadow-sm',
        recCfg.border,
        expanded ? recCfg.bg : 'bg-white hover:' + recCfg.bg,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-black text-muted-foreground">#{rank}</span>
        </div>

        {/* Avatar + info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-foreground">
              {student ? `${student.firstName} ${student.lastName}` : 'Student'}
            </span>
            {match.hiddenTalentFlag && (
              <span className="text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> HIDDEN TALENT
              </span>
            )}
            {match.biasAdjusted && (
              <span className="text-[9px] font-bold bg-teal-100 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> BIAS ADJ.
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[180px]">{student?.department ?? 'â€”'}</span>
            {student?.cgpa && <span className="flex-shrink-0">CGPA {student.cgpa}</span>}
            {student?.expectedGraduationYear && <span className="flex-shrink-0">{student.expectedGraduationYear}</span>}
            {match.reasonSummary && <span className="truncate max-w-[320px] text-[11px] text-muted-foreground">{match.reasonSummary}</span>}
          </div>

          {/* HSGM feature bars */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MiniBar label="Skills" value={overlapScore} colorClass={SCORE_COLORS.skill} icon={<Zap className="w-2 h-2" />} />
            <MiniBar label="Semantic" value={semanticScore} colorClass={SCORE_COLORS.domain} icon={<BookOpen className="w-2 h-2" />} />
            <MiniBar label="TRE" value={treScore} colorClass={SCORE_COLORS.experience} icon={<TrendingUp className="w-2 h-2" />} />
            <MiniBar label="GPA" value={gpaScore} colorClass={SCORE_COLORS.academic} icon={<Layers className="w-2 h-2" />} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            <span className="rounded-full bg-gray-50 px-2 py-1">Project {Math.round(projectScore)}%</span>
            <span className="rounded-full bg-gray-50 px-2 py-1">Trust {Math.round(trustScore)}%</span>
          </div>
        </div>

        {/* Right side: score + badges + toggle */}
        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="flex flex-col items-end gap-1.5">
            {/* Eligibility */}
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', eligCfg.color, eligCfg.bg)}>
              {eligCfg.label}
            </span>
            {/* Recommendation */}
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', recCfg.color, recCfg.bg)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', recCfg.dot)} />
              {recCfg.label}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-gray-50 self-start mt-0.5">
            HSGM
          </span>
          <ScoreCircle score={match.overallMatchPercentage} size="md" />
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && <ExpandedBreakdown match={match} />}
      </AnimatePresence>
    </motion.div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminMatching() {
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [runResults, setRunResults] = useState<MatchData[] | null>(null);

  const { data: liveJobs }     = useAdminJobs();
  const runMatchingMutation    = useAdminRunMatching();
  const { data: liveResults }  = useMatchResults(selectedJob);

  const allJobs = liveJobs ?? [];

  const rawMatches: MatchData[] = useMemo(() => {
    if (runResults && runResults.length > 0) {
      const liveByStudent = new Map(
        (liveResults ?? []).map((match) => [match.studentProfileId, match]),
      );
      return runResults.map((match) => {
        const hydrated = liveByStudent.get(match.studentProfileId);
        return hydrated ? { ...match, studentProfile: hydrated.studentProfile ?? match.studentProfile } : match;
      });
    }
    if (selectedJob && liveResults && liveResults.length > 0) return liveResults as MatchData[];
    return [];
  }, [runResults, selectedJob, liveResults]);

  const filtered = useMemo(() => {
    let list = rawMatches;
    if (activeTab !== 'ALL') list = list.filter(m => m.recommendation === activeTab);
    return [...list].sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);
  }, [rawMatches, activeTab]);

  const stats = useMemo(() => ({
    total:    rawMatches.length,
    eligible: rawMatches.filter(m => m.eligibilityStatus === 'ELIGIBLE').length,
    highRec:  rawMatches.filter(m => m.recommendation === 'HIGHLY_RECOMMENDED').length,
    hidden:   rawMatches.filter(m => m.hiddenTalentFlag).length,
    avg:      rawMatches.length > 0 ? Math.round(rawMatches.reduce((s, m) => s + m.overallMatchPercentage, 0) / rawMatches.length) : 0,
  }), [rawMatches]);

  const handleRun = () => {
    if (!selectedJob) return;
    setRunResults(null);
    runMatchingMutation.mutate(selectedJob, {
      onSuccess: (data) => {
        if (data?.results && Array.isArray(data.results)) {
          setRunResults(data.results as MatchData[]);
        }
        setActiveTab('ALL');
      },
    });
  };

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { ALL: rawMatches.length, HIGHLY_RECOMMENDED: 0, RECOMMENDED: 0, BORDERLINE: 0, NOT_RECOMMENDED: 0 };
    for (const m of rawMatches) counts[m.recommendation as Recommendation] = (counts[m.recommendation as Recommendation] ?? 0) + 1;
    return counts;
  }, [rawMatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-brand-oxford flex items-center gap-2">
          <Brain className="w-5 h-5" /> AI Matching Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          HSGM-aligned ranking · explainable feature graph · semantic matching · bias mitigation · hidden talent detection
        </p>
        {/* Formula pill */}
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1 bg-brand-oxford/5 border border-brand-oxford/10 text-[10px] font-mono text-brand-oxford px-3 py-1.5 rounded-full">
            Score = semantic + overlap + TRE + cert trust + curriculum + GPA
          </div>
          <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-[10px] font-semibold text-purple-700 px-3 py-1.5 rounded-full">
            <Brain className="w-3 h-3" /> Feature weights stay deterministic per job family
          </div>
        </div>
      </div>

      {/* Run controls */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-oxford" />
          <p className="text-sm font-bold text-foreground">Select Job & Run Matching</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Job Posting</label>
            <select
              value={selectedJob}
              onChange={e => { setSelectedJob(e.target.value); setRunResults(null); setActiveTab('ALL'); }}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10 transition-all"
            >
            <option value="">-- Select a job --</option>
            {allJobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} -- {(j as any).company?.name}</option>
            ))}
          </select>
          </div>
          <button
            onClick={handleRun}
            disabled={runMatchingMutation.isPending || !selectedJob}
            className="flex items-center gap-2 bg-brand-oxford text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60 transition-opacity whitespace-nowrap"
          >
            {runMatchingMutation.isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running...</>
              : <><Play className="w-4 h-4" /> Run Matching</>}
          </button>
        </div>

        {runMatchingMutation.isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-emerald-200"
          >
            <CheckCircle className="w-4 h-4" />
            Matching complete -- {stats.total} candidates scored
          </motion.div>
        )}

        {/* Algorithm badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { icon: <Brain className="w-3 h-3" />, label: 'Graph Semantic Matching' },
            { icon: <Zap className="w-3 h-3" />, label: '3-Hop Transitive Skills' },
            { icon: <ShieldCheck className="w-3 h-3" />, label: 'Bias Mitigation' },
            { icon: <Sparkles className="w-3 h-3" />, label: 'Hidden Talent Detection' },
            { icon: <BarChart3 className="w-3 h-3" />, label: 'Feature Scoring' },
            { icon: <Target className="w-3 h-3" />, label: 'Student Skill Expansion' },
          ].map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-oxford/5 text-brand-oxford border border-brand-oxford/10 px-2 py-1 rounded-full">
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Candidates', value: stats.total,    icon: <Users className="w-4 h-4" />, color: 'text-brand-oxford', bg: 'bg-brand-oxford/5' },
          { label: 'Eligible',         value: stats.eligible, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Highly Rec.',      value: stats.highRec,  icon: <Award className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hidden Talent',    value: stats.hidden,   icon: <Sparkles className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg. Score',       value: `${stats.avg}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-2xl border border-border p-4', s.bg)}>
            <div className={cn('flex items-center gap-1.5 mb-1', s.color)}>{s.icon}</div>
            <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl flex-wrap">
        {TABS.map(tab => {
          const count = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.key !== 'ALL' && (
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', RECOMMENDATION_CONFIG[tab.key as Recommendation]?.dot ?? 'bg-gray-400')} />
              )}
              {tab.label}
              <span className={cn(
                'text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-0.5',
                activeTab === tab.key ? 'bg-brand-oxford text-white' : 'bg-gray-200 text-muted-foreground',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Candidate list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={selectedJob ? 'No match results yet' : 'Select a job to inspect matches'}
            description={selectedJob ? 'Run matching to compute fresh explanations, verdicts, and fairness audit output.' : 'Choose a live job posting above to see the ranked candidate list.'}
          />
        ) : (
          filtered.map((match, i) => (
            <CandidateRow key={match.id} match={match} rank={i + 1} />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-2xl border border-border p-4">
        <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Legend</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">HIDDEN TALENT</span>
            High skill coverage despite lower academics -- bias mitigation applied
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold bg-teal-100 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full">BIAS ADJ.</span>
            Algorithm adjusted scoring to prevent over-penalizing non-traditional profiles
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">Aâ†’Bâ†’C</span>
            Graph path: skill matched via BFS traversal (e.g. NestJSâ†’Node.jsâ†’Express: 2-hop)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold bg-brand-oxford/10 text-brand-oxford px-1.5 py-0.5 rounded">TECH-HEAVY</span>
            HSGM signals adapt to the job requirements
          </div>
        </div>
      </div>
    </div>
  );
}


