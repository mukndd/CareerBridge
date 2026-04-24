import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, SlidersHorizontal, Search, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CandidateMatchCard from '@/components/shared/CandidateMatchCard';
import EmptyState from '@/components/shared/EmptyState';
import StudentInsightModal from '@/components/shared/StudentInsightModal';
import { apiGet } from '@/lib/api';
import { useJobs, useJobMatches, useRunMatching } from '@/hooks/api';
import { cn, dedupeMatchResultsByStudent } from '@/lib/utils';
import type { MatchResult } from '@/types';

export default function RecruiterMatches() {
  const [selectedJob, setSelectedJob] = useState('');
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [aggregateMatches, setAggregateMatches] = useState<MatchResult[] | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [initializedJob, setInitializedJob] = useState(false);
  const autoRunJobs = useRef<Set<string>>(new Set());
  const [searchParams] = useSearchParams();

  const toggleShortlist = (id: string) => {
    setShortlisted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { data: liveJobs } = useJobs();
  const { data: liveMatches } = useJobMatches(selectedJob !== 'all' ? selectedJob : '');
  const runMatching = useRunMatching();

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId) {
      setSelectedJob(jobId);
      setInitializedJob(true);
      return;
    }
    if (!initializedJob && liveJobs?.length) {
      const withApplicants = liveJobs.find((job) => (job._count?.applications ?? 0) > 0);
      setSelectedJob(withApplicants?.id ?? liveJobs[0].id);
      setInitializedJob(true);
    }
  }, [initializedJob, liveJobs, searchParams]);

  useEffect(() => {
    let cancelled = false;
    const loadAllMatches = async () => {
      if (selectedJob && selectedJob !== 'all') {
        setAggregateMatches(null);
        return;
      }
      if (!liveJobs?.length) {
        setAggregateMatches([]);
        return;
      }

      setAggregateLoading(true);
      try {
        const results = await Promise.all(
          liveJobs.map((job) => apiGet<MatchResult[]>(`/jobs/${job.id}/matches`)),
        );
        if (!cancelled) {
          setAggregateMatches(results.flat());
        }
      } catch {
        if (!cancelled) {
          setAggregateMatches([]);
        }
      } finally {
        if (!cancelled) {
          setAggregateLoading(false);
        }
      }
    };

    void loadAllMatches();
    return () => {
      cancelled = true;
    };
  }, [liveJobs, selectedJob]);

  useEffect(() => {
    if (!selectedJob || selectedJob === 'all') return;
    if (!liveJobs?.length) return;
    if (runMatching.isPending) return;
    if (autoRunJobs.current.has(selectedJob)) return;
    if (!liveMatches) return;
    if (liveMatches.length > 0) return;

    const selected = liveJobs.find((job) => job.id === selectedJob);
    if (!selected) return;

    autoRunJobs.current.add(selectedJob);
    runMatching.mutate(selectedJob);
  }, [liveJobs, liveMatches, runMatching, selectedJob]);

  const allJobs = liveJobs ?? [];
  const allMatches = selectedJob === 'all' || !selectedJob ? (aggregateMatches ?? []) : (liveMatches ?? []);
  const visibleMatches = selectedJob === 'all' || !selectedJob ? dedupeMatchResultsByStudent(allMatches) : allMatches;

  const filtered = visibleMatches.filter(m => {
    const matchJob = selectedJob === 'all' || !selectedJob || m.jobId === selectedJob;
    const matchScore = m.overallMatchPercentage >= minScore;
    const studentName = m.studentProfile ? `${m.studentProfile.firstName} ${m.studentProfile.lastName}` : '';
    const matchSearch = !search || studentName.toLowerCase().includes(search.toLowerCase());
    return matchJob && matchScore && matchSearch;
  }).sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-oxford">Candidate Matches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI-ranked candidates for your job listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
          />
        </div>
        <select
          value={selectedJob}
          onChange={e => setSelectedJob(e.target.value)}
          className="text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
        >
          <option value="">Select a job</option>
          <option value="all">All Jobs</option>
          {allJobs.map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Min score:</span>
          {[0, 50, 70, 85].map(s => (
            <button
              key={s}
              onClick={() => setMinScore(s)}
              className={cn(
                'text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all',
                minScore === s ? 'bg-brand-oxford text-white border-brand-oxford' : 'bg-white text-muted-foreground border-border',
              )}
            >
              {s === 0 ? 'All' : `${s}%+`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">{filtered.length} candidates</span>
        <span className="text-green-600 font-semibold">{filtered.filter(m => m.overallMatchPercentage >= 70).length} high matches</span>
        <span className="text-blue-600 font-semibold">{shortlisted.size} shortlisted</span>
      </div>

      {(selectedJob === 'all' || !selectedJob) && aggregateLoading && !aggregateMatches ? (
        <div className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading live matches...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No matches found"
          description={selectedJob === 'all'
            ? 'Select a specific job to load live candidate matches.'
            : 'Try adjusting filters or run AI matching for this job.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CandidateMatchCard
                match={match}
                onView={() => setSelectedMatch(match)}
                onShortlist={() => toggleShortlist(match.id)}
                isShortlisted={shortlisted.has(match.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <StudentInsightModal
        open={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        student={selectedMatch?.studentProfile ?? { firstName: '', lastName: '', department: '', activeBacklogs: 0, profileCompleteness: 0 }}
        match={selectedMatch}
        title="Candidate profile"
        subtitle="Match explanation, scores, and partial eligibility reasons"
      />
    </div>
  );
}
