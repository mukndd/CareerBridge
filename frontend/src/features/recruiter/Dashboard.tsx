import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, CheckCircle, TrendingUp, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';
import AIInsightCard from '@/components/shared/AIInsightCard';
import { useAuthStore } from '@/stores/auth.store';
import { useJobs } from '@/hooks/api';
import { apiGet } from '@/lib/api';
import type { MatchResult } from '@/types';

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { data: liveJobs } = useJobs();
  const jobs = liveJobs ?? [];
  const [allMatches, setAllMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (!liveJobs?.length) return;
    let cancelled = false;
    Promise.all(
      liveJobs.map(j =>
        apiGet<MatchResult[]>(`/jobs/${j.id}/matches`).catch(() => [] as MatchResult[]),
      ),
    ).then(results => {
      if (!cancelled) setAllMatches(results.flat());
    });
    return () => { cancelled = true; };
  }, [liveJobs]);

  const totalCandidates = jobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);
  const highMatchCount = allMatches.filter(m => m.overallMatchPercentage >= 70).length;
  const avgMatchScore = allMatches.length > 0
    ? Math.round(allMatches.reduce((s, m) => s + m.overallMatchPercentage, 0) / allMatches.length)
    : 0;

  const dynamicInsights = useMemo(() => {
    const insights: { message: string; action: string; priority: 'high' | 'medium' | 'low' }[] = [];

    const topCandidates = allMatches.filter(m => m.overallMatchPercentage >= 85);
    if (topCandidates.length > 0) {
      insights.push({
        message: `${topCandidates.length} candidate${topCandidates.length > 1 ? 's' : ''} score above 85% across your job listings. Review shortlist before deadlines.`,
        action: 'View matches',
        priority: 'high',
      });
    }

    const zeroApplicantJobs = jobs.filter(j => j.status === 'OPEN' && (j._count?.applications ?? 0) === 0);
    if (zeroApplicantJobs.length > 0) {
      insights.push({
        message: `"${zeroApplicantJobs[0].title}" has no applicants yet. Consider wider outreach.`,
        action: 'View job',
        priority: 'medium',
      });
    }

    const deadlineSoon = jobs.filter(j => {
      if (!j.applicationDeadline || j.status !== 'OPEN') return false;
      const days = (new Date(j.applicationDeadline).getTime() - Date.now()) / 86_400_000;
      return days > 0 && days <= 5;
    });
    if (deadlineSoon.length > 0) {
      const daysLeft = Math.ceil(
        (new Date(deadlineSoon[0].applicationDeadline!).getTime() - Date.now()) / 86_400_000,
      );
      insights.push({
        message: `"${deadlineSoon[0].title}" closes in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Finalize your shortlist.`,
        action: 'View shortlist',
        priority: 'high',
      });
    }

    if (allMatches.length > 0) {
      const missingAll = allMatches.flatMap(m => m.missingSkills);
      if (missingAll.length > 0) {
        const counts = missingAll.reduce(
          (acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; },
          {} as Record<string, number>,
        );
        const [topSkill, freq] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
        if (freq >= 2) {
          insights.push({
            message: `"${topSkill}" is missing in ${freq} candidate profiles across your active JDs.`,
            action: 'Adjust JD',
            priority: 'medium',
          });
        }
      }
    }

    if (insights.length === 0) {
      insights.push({
        message: 'Post a job and run AI matching to see personalized recruiter insights here.',
        action: 'Post a job',
        priority: 'medium',
      });
    }

    return insights.slice(0, 3);
  }, [jobs, allMatches]);

  const topMatchCandidates = [...allMatches]
    .sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-brand-oxford">Recruiter Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.name?.split(' ')[0] ?? 'Recruiter'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active JDs', value: String(jobs.filter(j => j.status === 'OPEN').length), icon: Briefcase, color: 'text-brand-oxford' as const, trend: undefined },
          { title: 'Total Candidates', value: String(totalCandidates), icon: Users, color: 'text-blue-600' as const, trend: undefined },
          { title: 'High Matches ≥70%', value: String(highMatchCount), icon: CheckCircle, color: 'text-green-600' as const, trend: undefined },
          { title: 'Avg Match Score', value: avgMatchScore > 0 ? `${avgMatchScore}%` : '—', icon: TrendingUp, color: 'text-amber-500' as const, trend: undefined },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Top Candidate Matches"
            subtitle={topMatchCandidates.length === 0 ? 'Run AI matching from the matches page to populate this section' : 'Highest scoring candidates across your job listings'}
            icon={Target}
            action={
              <Link to="/recruiter/matches" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {topMatchCandidates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3">No live match results yet.</div>
            ) : (
              <div className="space-y-2.5">
                {topMatchCandidates.map((match, i) => {
                  const profile = match.studentProfile;
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-border hover:border-brand-oxford/20 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-oxford/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-brand-oxford">{name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.department ?? ''}{match.job?.title ? ` · ${match.job.title}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {match.overallMatchPercentage}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Your Job Listings" icon={Briefcase}>
            <div className="space-y-2.5">
              {jobs.slice(0, 3).map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-border hover:border-brand-oxford/20 transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {job._count?.applications ?? 0} applicants
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {job.applicationDeadline
                        ? `Due ${new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                        : ''}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </div>

        <AIInsightCard title="Recruiter AI" insights={dynamicInsights} />
      </div>
    </div>
  );
}
