import { motion } from 'framer-motion';
import { Briefcase, Users, CheckCircle, TrendingUp, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';
import AIInsightCard from '@/components/shared/AIInsightCard';
import { useAuthStore } from '@/stores/auth.store';
import { useJobs } from '@/hooks/api';

const AI_INSIGHTS = [
  { message: '3 candidates match > 85% for the SDE role. Review shortlist before deadline.', action: 'View shortlist', priority: 'high' as const },
  { message: 'Priya Nair (92%) hasn\'t applied yet — consider a direct outreach.', action: 'Contact student', priority: 'medium' as const },
  { message: 'Your JD mentions "distributed systems" but 0 candidates have this skill.', action: 'Adjust JD', priority: 'medium' as const },
];

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { data: liveJobs } = useJobs();
  const jobs = liveJobs ?? [];
  const topMatches = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-brand-oxford">Recruiter Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.name?.split(' ')[0] ?? 'Recruiter'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active JDs', value: String(jobs.filter(j => j.status === 'OPEN').length), icon: Briefcase, color: 'text-brand-oxford' as const, trend: undefined },
          { title: 'Total Candidates', value: '47', trend: { value: 5, positive: true }, icon: Users, color: 'text-blue-600' as const },
          { title: 'Shortlisted', value: '8', trend: { value: 2, positive: true }, icon: CheckCircle, color: 'text-green-600' as const },
          { title: 'Avg Match Score', value: '74%', trend: { value: 3, positive: true }, icon: TrendingUp, color: 'text-amber-500' as const },
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
            subtitle="Run AI matching from the matches page to populate this section"
            icon={Target}
            action={
              <Link to="/recruiter/matches" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {topMatches.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3">No live match results yet.</div>
            ) : null}
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
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{job._count?.applications ?? 0} applicants</span>
                    <span className="text-[11px] text-muted-foreground">
                      {job.applicationDeadline ? `Due ${new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </div>

        <AIInsightCard title="Recruiter AI" insights={AI_INSIGHTS} />
      </div>
    </div>
  );
}
