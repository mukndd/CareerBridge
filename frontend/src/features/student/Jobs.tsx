import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Briefcase, X, MapPin, Clock, Users, ChevronDown } from 'lucide-react';
import JobCard from '@/components/shared/JobCard';
import EmptyState from '@/components/shared/EmptyState';
import { useJobs, useApplyToJob, useStudentApplications, useStudentProfile } from '@/hooks/api';
import { cn } from '@/lib/utils';
import type { Job, EligibilityStatus } from '@/types';

const FILTERS = ['All', 'High Match', 'Eligible', 'New', 'Internship', 'Full Time'];

export default function StudentJobs() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const { data: liveJobs } = useJobs({ status: 'OPEN' });
  const { data: profile } = useStudentProfile();
  const { data: applications } = useStudentApplications();
  const applyMutation = useApplyToJob();

  const allJobs = liveJobs ?? [];
  const appliedJobIds = useMemo(() => new Set((applications ?? []).map(app => app.jobId)), [applications]);
  const studentSkillNames = useMemo(() => new Set((profile?.studentSkills ?? []).map(s => s.skill?.name).filter(Boolean)), [profile]);

  const jobsWithMatch = allJobs.map(job => {
    const required = job.jobSkills?.filter(s => s.type === 'REQUIRED') ?? [];
    const matched = required.filter(s => studentSkillNames.has(s.skill?.name ?? s.skillId));
    const matchScore = required.length > 0 ? Math.round((matched.length / required.length) * 100) : undefined;
    const cgpa = profile?.cgpa ?? 0;
    const backlogs = profile?.activeBacklogs ?? 0;
    const eligibility: EligibilityStatus = (job.minCgpa != null && cgpa < job.minCgpa) || (job.maxBacklogs != null && backlogs > job.maxBacklogs)
      ? 'INELIGIBLE'
      : job.eligibleBranches?.length && profile?.department && !job.eligibleBranches.includes(profile.department)
        ? 'PARTIALLY_ELIGIBLE'
        : 'ELIGIBLE';
    return { job, matchScore, eligibility };
  });

  const filtered = jobsWithMatch
    .filter(({ job, matchScore, eligibility }) => {
      const q = search.toLowerCase();
      const matchesSearch = job.title?.toLowerCase().includes(q) || job.company?.name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (activeFilter === 'Internship') return job.jobType === 'INTERNSHIP';
      if (activeFilter === 'Full Time') return job.jobType === 'FULL_TIME';
      if (activeFilter === 'High Match') return (matchScore ?? 0) >= 75;
      if (activeFilter === 'Eligible') return eligibility === 'ELIGIBLE';
      return true;
    })
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-oxford">Job Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {allJobs.length} open positions · Ranked from your current profile
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, companies..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground border border-border bg-white px-4 py-2.5 rounded-xl hover:border-brand-oxford/30 transition-colors">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
              activeFilter === f
                ? 'bg-brand-oxford text-white border-brand-oxford'
                : 'bg-white text-muted-foreground border-border hover:border-brand-oxford/30',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(({ job, matchScore, eligibility }, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <JobCard
                job={job}
                matchScore={matchScore}
                eligibility={eligibility}
                isApplied={appliedJobIds.has(job.id)}
                isApplying={pendingJobId === job.id}
                onApply={() => {
                  if (appliedJobIds.has(job.id)) return;
                  setPendingJobId(job.id);
                  applyMutation.mutate(job.id, {
                    onSuccess: () => setSelectedJob(job),
                    onSettled: () => setPendingJobId(null),
                  });
                }}
                onClick={() => setSelectedJob(job)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedJob(null)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div>
                <p className="text-sm font-black text-brand-oxford">{selectedJob.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedJob.company?.name}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <MapPin className="w-4 h-4 text-brand-oxford" />
                  <p className="mt-2 text-xs text-muted-foreground">Location</p>
                  <p className="font-semibold">{selectedJob.location ?? 'Remote / flexible'}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <Clock className="w-4 h-4 text-brand-oxford" />
                  <p className="mt-2 text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold">{selectedJob.jobType.replace('_', ' ')}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <Users className="w-4 h-4 text-brand-oxford" />
                  <p className="mt-2 text-xs text-muted-foreground">Applicants</p>
                  <p className="font-semibold">{selectedJob._count?.applications ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <ChevronDown className="w-4 h-4 text-brand-oxford" />
                  <p className="mt-2 text-xs text-muted-foreground">Package</p>
                  <p className="font-semibold">{selectedJob.ctcMin != null && selectedJob.ctcMax != null ? `₹${selectedJob.ctcMin}–${selectedJob.ctcMax} LPA` : '—'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground max-h-72 overflow-y-auto">
                {selectedJob.rawJdText || selectedJob.description}
              </div>

              {selectedJob.responsibilities?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Responsibilities</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {selectedJob.responsibilities.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-oxford flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedJob.jobSkills?.map((skill) => (
                  <span key={skill.id} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {skill.skill?.name ?? skill.skillId}
                  </span>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (appliedJobIds.has(selectedJob.id)) return;
                    setPendingJobId(selectedJob.id);
                    applyMutation.mutate(selectedJob.id, {
                      onSettled: () => setPendingJobId(null),
                    });
                  }}
                  disabled={appliedJobIds.has(selectedJob.id)}
                  className="rounded-xl bg-brand-oxford px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {appliedJobIds.has(selectedJob.id) ? 'Applied' : 'Apply to this job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
