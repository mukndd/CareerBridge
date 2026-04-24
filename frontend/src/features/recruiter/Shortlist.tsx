import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Mail, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionCard from '@/components/shared/SectionCard';
import EmptyState from '@/components/shared/EmptyState';
import { useGenerateShortlist, useJobs, useJobShortlist } from '@/hooks/api';
import { cn } from '@/lib/utils';
import type { Shortlist } from '@/types';

export default function RecruiterShortlist() {
  const [selectedJob, setSelectedJob] = useState('');
  const autoGenerateJobs = useRef<Set<string>>(new Set());
  const { data: liveJobs } = useJobs();
  const { data: liveShortlist } = useJobShortlist(selectedJob);
  const generateShortlist = useGenerateShortlist();

  useEffect(() => {
    if (!selectedJob && liveJobs?.length) {
      const withApplicants = liveJobs.find((job) => (job._count?.applications ?? 0) > 0);
      setSelectedJob(withApplicants?.id ?? liveJobs[0].id);
    }
  }, [liveJobs, selectedJob]);

  useEffect(() => {
    if (!selectedJob || !liveJobs?.length) return;
    if (generateShortlist.isPending) return;
    if (autoGenerateJobs.current.has(selectedJob)) return;

    const job = liveJobs.find((entry) => entry.id === selectedJob);
    if (!job || (job._count?.applications ?? 0) === 0) return;
    if (!liveShortlist) return;
    if (liveShortlist.length > 0) return;

    autoGenerateJobs.current.add(selectedJob);
    generateShortlist.mutate({ jobId: selectedJob });
  }, [generateShortlist, liveJobs, liveShortlist, selectedJob]);

  const shortlistedMatches: Shortlist[] = liveShortlist ?? [];

  const remove = (_id: string) => {
    // Backed by the API now; inline removal can be wired to the backend later.
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">Shortlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{shortlistedMatches.length} candidates shortlisted</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
          >
            {liveJobs?.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-1.5 text-xs font-semibold border border-border bg-white text-foreground px-3.5 py-2 rounded-xl hover:border-brand-oxford/30 transition-colors">
            <Mail className="w-3.5 h-3.5" /> Notify All
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold bg-brand-oxford text-white px-3.5 py-2 rounded-xl hover:bg-brand-oxford/90 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {shortlistedMatches.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon={Users}
            title="No candidates shortlisted"
            description={selectedJob ? 'This job has no shortlist entries yet. Open Top Matches and shortlist applied candidates.' : 'Choose a job to view its shortlist.'}
          />
          {selectedJob && (
            <div className="flex justify-center">
              <Link
                to="/recruiter/matches"
                className="text-xs font-semibold text-brand-oxford border border-brand-oxford/30 hover:bg-brand-oxford/5 px-3.5 py-2 rounded-xl transition-colors"
              >
                Review live matches
              </Link>
            </div>
          )}
        </div>
      ) : (
        <SectionCard title="Shortlisted Candidates" icon={Users}>
          <div className="space-y-3">
            {shortlistedMatches.map((item, i) => {
              const profile = item.application?.studentProfile;
              const displayName = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';
              const dept = profile?.department ?? 'Unknown department';
              const cgpa = profile?.cgpa ? `CGPA ${profile.cgpa}` : 'CGPA n/a';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 border border-border hover:border-brand-oxford/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-oxford/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-oxford">
                      {displayName.charAt(0)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {dept} · {cgpa}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold',
                        item.status === 'HIGHLY_RECOMMENDED'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'RECOMMENDED'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'BORDERLINE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800',
                      )}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <div className="flex gap-1.5">
                      <button className="text-xs font-semibold text-brand-oxford border border-brand-oxford/30 hover:bg-brand-oxford/5 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Contact
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {shortlistedMatches.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Shortlisted', value: shortlistedMatches.length.toString() },
            { label: 'High Confidence', value: shortlistedMatches.filter((item) => item.status === 'HIGHLY_RECOMMENDED').length.toString() },
            { label: 'Recommended', value: shortlistedMatches.filter((item) => item.status === 'RECOMMENDED').length.toString() },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border shadow-card p-4 text-center">
              <p className="text-lg font-black text-brand-oxford">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
