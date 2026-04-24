import { motion } from 'framer-motion';
import { Briefcase, FileText, Star, TrendingUp, Bell, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';
import AIInsightCard from '@/components/shared/AIInsightCard';
import ProfileCompletionCard from '@/components/shared/ProfileCompletionCard';
import SkillChip from '@/components/shared/SkillChip';
import { useStudentProfile, useStudentApplications, useJobs } from '@/hooks/api';

const COMPLETION_STEPS = [
  { label: 'Basic profile', done: true },
  { label: 'Upload resume', done: true, href: '/student/resume' },
  { label: 'Add 3+ skills', done: true },
  { label: 'Add projects', done: false, href: '/student/profile' },
  { label: 'Add certifications', done: false, href: '/student/profile' },
  { label: 'Link LinkedIn', done: false, href: '/student/profile' },
];

const AI_INSIGHTS = [
  { message: 'Your Python skills are high confidence — 8 open roles match. Apply before deadlines close.', action: 'Browse Python jobs', href: '/student/jobs', priority: 'high' as const },
  { message: 'Adding a ML project could boost your Google match score from 74% → 89%.', action: 'Add project', href: '/student/profile', priority: 'medium' as const },
  { message: 'Wipro Technologies deadline is in 3 days. You are eligible — act fast.', action: 'Apply now', href: '/student/jobs', priority: 'high' as const },
];

const RECENT_ACTIVITY = [
  { text: 'Applied to Google SWE Internship', time: '2h ago', dot: 'bg-blue-500' },
  { text: 'Resume enhanced by AI', time: '1d ago', dot: 'bg-green-500' },
  { text: 'New match: Amazon SDE — 88%', time: '2d ago', dot: 'bg-brand-oxford' },
  { text: 'Profile viewed by Infosys recruiter', time: '3d ago', dot: 'bg-brand-tan-500' },
];

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: profile } = useStudentProfile();
  const { data: applications } = useStudentApplications();
  const { data: jobs } = useJobs({ status: 'OPEN' });

  const liveProfile = profile;
  const liveApplications = applications ?? [];
  const topMatches = [];

  const completionSteps = profile ? [
    { label: 'Basic profile', done: true },
    { label: 'Upload resume', done: (profile as any).resumes?.length > 0, href: '/student/resume' },
    { label: 'Add 3+ skills', done: (profile.studentSkills?.length ?? 0) >= 3 },
    { label: 'Add projects', done: (profile as any).projects?.length > 0, href: '/student/profile' },
    { label: 'Add certifications', done: (profile as any).certifications?.length > 0, href: '/student/profile' },
    { label: 'Link LinkedIn', done: !!profile.linkedinUrl, href: '/student/profile' },
  ] : COMPLETION_STEPS;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black text-brand-oxford">
          Good morning, {user?.name?.split(' ')[0] ?? profile?.firstName ?? 'Student'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Placement season active
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Open Jobs', value: String(jobs?.length ?? 0), trend: { value: 3, positive: true }, icon: Briefcase, color: 'text-brand-oxford' as const },
          { title: 'Applications', value: String(liveApplications.length), trend: { value: 1, positive: true }, icon: FileText, color: 'text-blue-600' as const },
          { title: 'Top Match Score', value: '92%', trend: { value: 5, positive: true }, icon: Star, color: 'text-amber-500' as const },
          { title: 'Profile Views', value: '24', trend: { value: 8, positive: true }, icon: TrendingUp, color: 'text-green-600' as const },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Matches */}
          <SectionCard
            title="Top Job Matches"
            subtitle="Run matching from an admin account to populate this section"
            icon={Star}
            action={
              <Link to="/student/jobs" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                View jobs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {topMatches.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3">No live match results yet.</div>
            ) : null}
          </SectionCard>

          {/* Applications */}
          <SectionCard
            title="Recent Applications"
            subtitle="Track your application pipeline"
            icon={FileText}
            action={
              <Link to="/student/applications" className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {liveApplications.slice(0, 3).map((app, i) => {
                const statusColor: Record<string, string> = {
                  APPLIED: 'bg-gray-100 text-gray-600',
                  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
                  SHORTLISTED: 'bg-indigo-50 text-indigo-700',
                  INTERVIEW_SCHEDULED: 'bg-amber-50 text-amber-700',
                  SELECTED: 'bg-green-50 text-green-700',
                  REJECTED: 'bg-red-50 text-red-600',
                  WITHDRAWN: 'bg-gray-50 text-gray-500',
                };
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{app.job?.title ?? 'Job'}</p>
                      <p className="text-xs text-muted-foreground">{app.job?.company?.name}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>

          {/* Skills snapshot */}
          <SectionCard title="Your Top Skills" icon={TrendingUp}>
            <div className="flex flex-wrap gap-2">
              {liveProfile?.studentSkills?.slice(0, 10).map((s, i) => (
                <SkillChip key={i} name={s.skill?.name ?? s.skillId} confidence={s.confidence} />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Side col */}
        <div className="space-y-5">
          <ProfileCompletionCard steps={completionSteps} />

          <AIInsightCard insights={AI_INSIGHTS} />

          {/* Recent Activity */}
          <SectionCard title="Recent Activity" icon={Bell}>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`} />
                  <div>
                    <p className="text-xs text-foreground">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Upcoming */}
          <SectionCard title="Upcoming Deadlines" icon={Calendar}>
            <div className="space-y-3">
              {(jobs ?? [])
                .filter(j => j.applicationDeadline)
                .sort((a, b) => new Date(a.applicationDeadline!).getTime() - new Date(b.applicationDeadline!).getTime())
                .slice(0, 3)
                .map((job, i) => {
                  const daysLeft = Math.ceil((new Date(job.applicationDeadline!).getTime() - Date.now()) / 86_400_000);
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{job.company?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{job.title}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 3 ? 'bg-red-50 text-red-600' : daysLeft <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                        {daysLeft}d left
                      </span>
                    </div>
                  );
                })}
              {(!jobs || jobs.filter(j => j.applicationDeadline).length === 0) && (
                <div className="text-sm text-muted-foreground py-3">
                  No upcoming deadlines yet.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
