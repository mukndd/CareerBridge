import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, Briefcase, TrendingUp, CheckCircle, Clock,
  BarChart3, ChevronRight, Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';
import AIInsightCard from '@/components/shared/AIInsightCard';
import { useAdminAnalytics, useAdminCompanies } from '@/hooks/api';


const TIMELINE = [
  { text: 'Google shortlist exported (8 candidates)', time: '30m ago', dot: 'bg-green-500' },
  { text: 'Amazon JD uploaded and parsed', time: '2h ago', dot: 'bg-blue-500' },
  { text: 'Batch AI matching run completed — 47 results', time: '4h ago', dot: 'bg-brand-oxford' },
  { text: 'Arjun Sharma profile updated', time: '1d ago', dot: 'bg-gray-400' },
  { text: 'Wipro Technologies recruiter registered', time: '2d ago', dot: 'bg-brand-tan-500' },
];

export default function AdminDashboard() {
  const { data: liveAnalytics } = useAdminAnalytics();
  const { data: liveCompanies } = useAdminCompanies();

  const dynamicInsights = useMemo(() => {
    if (!liveAnalytics) {
      return [{ message: 'Loading placement data…', action: 'Refresh', priority: 'medium' as const }];
    }
    const { overview, shortlistBreakdown, applicationStatusBreakdown } = liveAnalytics;
    const insights: { message: string; action: string; priority: 'high' | 'medium' | 'low' }[] = [];

    const highRec = (shortlistBreakdown.HIGHLY_RECOMMENDED ?? 0) + (shortlistBreakdown.RECOMMENDED ?? 0);
    if (highRec > 0) {
      insights.push({
        message: `${highRec} candidate${highRec > 1 ? 's' : ''} are recommended across active jobs. Review shortlists to move them forward.`,
        action: 'Review shortlists',
        priority: 'high',
      });
    }

    const pendingReview = applicationStatusBreakdown.UNDER_REVIEW ?? 0;
    if (pendingReview > 5) {
      insights.push({
        message: `${pendingReview} applications are pending review. Batch-process them to keep the pipeline moving.`,
        action: 'Review',
        priority: 'medium',
      });
    }

    if (overview.totalMatches > 0 && overview.totalStudents > 0) {
      const matchRate = Math.round((overview.totalMatches / overview.totalStudents) * 100);
      insights.push({
        message: `AI matching coverage is at ${matchRate}% of students. Run batch matching to improve coverage.`,
        action: 'Run matching',
        priority: matchRate < 50 ? 'high' : 'medium',
      });
    }

    if (insights.length === 0) {
      insights.push({
        message: 'All systems operational. Run AI matching on new jobs to get placement recommendations.',
        action: 'Run matching',
        priority: 'medium',
      });
    }

    return insights.slice(0, 3);
  }, [liveAnalytics]);

  const analytics = liveAnalytics ?? {
    overview: {
      totalStudents: 0,
      totalJobs: 0,
      openJobs: 0,
      totalCompanies: 0,
      totalApplications: 0,
      recentApplications: 0,
      totalMatches: 0,
    },
    shortlistBreakdown: {
      HIGHLY_RECOMMENDED: 0,
      RECOMMENDED: 0,
      BORDERLINE: 0,
      NOT_RECOMMENDED: 0,
    },
    applicationStatusBreakdown: {
      APPLIED: 0,
      UNDER_REVIEW: 0,
      SHORTLISTED: 0,
      INTERVIEW_SCHEDULED: 0,
      SELECTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
  };
  const companies = liveCompanies ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-brand-oxford">Placement Cell Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Placement Season 2025–26
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Students', value: String(analytics.overview.totalStudents), trend: { value: 12, positive: true }, icon: Users, color: 'text-brand-oxford' as const },
          { title: 'Active Companies', value: String(analytics.overview.totalCompanies), trend: { value: 3, positive: true }, icon: Building2, color: 'text-blue-600' as const },
          { title: 'Open Positions', value: String(analytics.overview.openJobs), trend: { value: 5, positive: true }, icon: Briefcase, color: 'text-amber-500' as const },
          { title: 'Applications', value: String(analytics.overview.totalApplications), trend: { value: 8, positive: true }, icon: TrendingUp, color: 'text-green-600' as const },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Placement funnel */}
          <SectionCard title="Placement Funnel" subtitle="Current season progress" icon={BarChart3}>
            <div className="space-y-3">
              {[
                { label: 'Registered Students', value: analytics.overview.totalStudents, max: analytics.overview.totalStudents, color: 'bg-brand-oxford' },
                { label: 'Total Matches', value: analytics.overview.totalMatches > 999 ? 999 : analytics.overview.totalMatches, max: analytics.overview.totalStudents, color: 'bg-blue-500' },
                { label: 'Applications', value: analytics.overview.totalApplications, max: analytics.overview.totalStudents, color: 'bg-amber-500' },
                { label: 'Shortlisted', value: analytics.shortlistBreakdown.HIGHLY_RECOMMENDED + analytics.shortlistBreakdown.RECOMMENDED, max: analytics.overview.totalStudents, color: 'bg-purple-500' },
                { label: 'Recent Activity', value: analytics.overview.recentApplications, max: analytics.overview.totalStudents, color: 'bg-green-500' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / row.max) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                      className={`h-full rounded-full ${row.color}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Top matches */}
          <SectionCard
            title="Recent Match Results"
            subtitle="Run matching from the AI Matching page to populate this section"
            icon={Target}
            action={
              <Link to="/admin/matching" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                Run Matching <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="text-sm text-muted-foreground py-3">No live match results yet.</div>
          </SectionCard>

          {/* Company overview */}
          <SectionCard
            title="Active Companies"
            icon={Building2}
            action={
              <Link to="/admin/companies" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {companies.slice(0, 6).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="p-3 rounded-xl bg-gray-50/80 border border-border hover:border-brand-oxford/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-oxford/8 flex items-center justify-center mb-2">
                    <Building2 className="w-4 h-4 text-brand-oxford" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.industry}</p>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <AIInsightCard title="Placement Cell AI" insights={dynamicInsights} />

          {/* Application stats */}
          <SectionCard title="Application Status" icon={CheckCircle}>
            <div className="space-y-2.5">
              {[
                { label: 'Pending Review', value: analytics.applicationStatusBreakdown.UNDER_REVIEW ?? 0, color: 'bg-gray-200' },
                { label: 'Shortlisted', value: analytics.applicationStatusBreakdown.SHORTLISTED ?? 0, color: 'bg-blue-400' },
                { label: 'Interviews', value: analytics.applicationStatusBreakdown.INTERVIEW_SCHEDULED ?? 0, color: 'bg-amber-400' },
                { label: 'Offered', value: analytics.applicationStatusBreakdown.SELECTED ?? 0, color: 'bg-green-500' },
                { label: 'Rejected', value: analytics.applicationStatusBreakdown.REJECTED ?? 0, color: 'bg-red-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-foreground">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Recent Activity" icon={Clock}>
            <div className="space-y-3">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.dot}`} />
                  <div>
                    <p className="text-xs text-foreground">{t.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
