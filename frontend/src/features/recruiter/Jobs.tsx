import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Users, Clock, Sparkles, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '@/components/shared/SectionCard';
import EmptyState from '@/components/shared/EmptyState';
import SkillChip from '@/components/shared/SkillChip';
import { useJobs, useCreateJob, usePreviewParseJD, useMe, type ParsedJDPreview } from '@/hooks/api';
import { cn } from '@/lib/utils';
import { getApiError } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-50 text-green-700 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── Post Job Form ─────────────────────────────────────────────────────────────

function PostJobForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'jd' | 'review'>('jd');
  const [jdText, setJdText] = useState('');
  const [parsed, setParsed] = useState<ParsedJDPreview | null>(null);
  const [error, setError] = useState('');

  // Editable fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [ctcMin, setCtcMin] = useState('');
  const [ctcMax, setCtcMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);

  const previewParse = usePreviewParseJD();
  const createJob = useCreateJob();
  const { data: me } = useMe();
  const company = me?.recruiterProfile?.company;
  const companyId = company?.id;
  const companyName = company?.name;

  useEffect(() => {
    setError('');
  }, [step]);

  const handleParse = async () => {
    if (!jdText.trim()) return;
    try {
      setError('');
      const result = await previewParse.mutateAsync(jdText);
      const p = result.parsedData;
      setParsed(p);
      if (p.jobTitle) setTitle(p.jobTitle);
      if (p.location) setLocation(p.location);
      if (p.jobType) setJobType(p.jobType);
      if (p.ctcMin) setCtcMin(String(p.ctcMin));
      if (p.ctcMax) setCtcMax(String(p.ctcMax));
      setRequiredSkills(p.requiredSkills ?? []);
      setPreferredSkills(p.preferredSkills ?? []);
      setSoftSkills(p.softSkills ?? []);
      setStep('review');
    } catch {
      // Fallback: move to review with empty parsed
      setParsed({});
      setStep('review');
    }
  };

  const handlePost = async () => {
    try {
      if (!companyId) {
        setError('No company is linked to this recruiter account. Ask admin to connect your company profile first.');
        return;
      }
      setError('');
      await createJob.mutateAsync({
        companyId,
        title,
        location,
        jobType: jobType as any,
        ctcMin: ctcMin ? Number(ctcMin) : undefined,
        ctcMax: ctcMax ? Number(ctcMax) : undefined,
        applicationDeadline: deadline || undefined,
        rawJdText: jdText || undefined,
        description: jdText || title,
        responsibilities: parsed?.responsibilities ?? [],
        keywords: parsed?.keywords ?? [],
        minCgpa: parsed?.minCgpa,
        maxBacklogs: parsed?.maxBacklogs,
        eligibleBranches: parsed?.eligibleBranches ?? [],
        allowedGraduationYears: parsed?.allowedGraduationYears ?? [],
        requiredSkills,
        preferredSkills,
        status: 'OPEN',
      } as any);
      onClose();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionCard title={step === 'jd' ? 'Post a Job — Paste Job Description' : 'Review Extracted Job Details'} icon={Briefcase}>
        {step === 'jd' ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Paste the complete job description. AI will extract skills, eligibility, and job details automatically.
            </p>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              rows={10}
              placeholder="Paste the job description here — include responsibilities, required skills, eligibility criteria, CTC range..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all resize-none font-mono"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="text-xs font-semibold border border-border text-muted-foreground px-4 py-2 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!jdText.trim() || previewParse.isPending}
                className="flex items-center gap-2 text-xs font-semibold bg-brand-oxford text-white px-4 py-2 rounded-xl disabled:opacity-50"
              >
                {previewParse.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing with AI...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Parse with AI</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {companyName && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                Posting as <b>{companyName}</b>
              </div>
            )}

            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Job Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineer"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bengaluru"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Job Type</label>
                <select value={jobType} onChange={e => setJobType(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">CTC Min (LPA)</label>
                <input type="number" value={ctcMin} onChange={e => setCtcMin(e.target.value)} placeholder="e.g. 8"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">CTC Max (LPA)</label>
                <input type="number" value={ctcMax} onChange={e => setCtcMax(e.target.value)} placeholder="e.g. 12"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Application Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all" />
              </div>
            </div>

            {/* Eligibility summary */}
            {parsed && (parsed.minCgpa || parsed.maxBacklogs !== undefined || parsed.eligibleBranches?.length) && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-blue-800">AI-Extracted Eligibility</p>
                <div className="flex flex-wrap gap-3 text-xs text-blue-700">
                  {parsed.minCgpa && <span>Min CGPA: <b>{parsed.minCgpa}</b></span>}
                  {parsed.maxBacklogs !== undefined && <span>Max Backlogs: <b>{parsed.maxBacklogs}</b></span>}
                  {parsed.eligibleBranches?.length && <span>Branches: <b>{parsed.eligibleBranches.join(', ')}</b></span>}
                </div>
              </div>
            )}

            {/* Required Skills */}
            <SkillTagEditor label="Required Skills" skills={requiredSkills} onChange={setRequiredSkills} color="red" />

            {/* Preferred Skills */}
            <SkillTagEditor label="Preferred Skills" skills={preferredSkills} onChange={setPreferredSkills} color="blue" />

            {/* Soft Skills */}
            <SkillTagEditor label="Soft Skills" skills={softSkills} onChange={setSoftSkills} color="purple" />

            <div className="flex gap-3">
              <button onClick={() => setStep('jd')} className="text-xs font-semibold border border-border text-muted-foreground px-4 py-2 rounded-xl">
                Back
              </button>
              <button
                onClick={handlePost}
                disabled={!title || createJob.isPending || !companyId}
                className="flex items-center gap-2 text-xs font-semibold bg-brand-oxford text-white px-4 py-2 rounded-xl disabled:opacity-50"
              >
                {createJob.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Post Job
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

function SkillTagEditor({
  label, skills, onChange, color,
}: { label: string; skills: string[]; onChange: (s: string[]) => void; color: 'red' | 'blue' | 'purple' }) {
  const [input, setInput] = useState('');
  const colorMap = {
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {skills.map(s => (
          <span key={s} className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border', colorMap[color])}>
            {s}
            <button onClick={() => onChange(skills.filter(x => x !== s))}><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSkill()}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
        />
        <button onClick={addSkill} className="text-xs font-semibold bg-white border border-border text-muted-foreground px-3 py-2 rounded-xl hover:border-brand-oxford/40">
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, i }: { job: any; i: number }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="bg-white rounded-2xl border border-border shadow-card hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">{job.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{job.company?.name} · {job.location}</p>
          </div>
          <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0', STATUS_COLORS[job.status ?? 'OPEN'])}>
            {job.status ?? 'OPEN'}
          </span>
        </div>

        {job.jobSkills && job.jobSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.jobSkills.filter((s: any) => s.type === 'REQUIRED').slice(0, 6).map((s: any) => (
              <SkillChip key={s.skillId} name={s.skill?.name ?? s.skillId} variant="outline" size="sm" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="w-3 h-3" />{job._count?.applications ?? 0} applicants
          </span>
          {job.applicationDeadline && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Deadline {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <div className="ml-auto flex gap-2 items-center">
            <button
              onClick={() => navigate(`/recruiter/matches?jobId=${job.id}`)}
              className="text-xs font-semibold text-brand-oxford hover:underline"
            >
              View Matches
            </button>
            {(job.description || job.rawJdText) && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-muted-foreground hover:text-foreground"
                title={expanded ? 'Hide JD' : 'View JD'}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable JD */}
      <AnimatePresence>
        {expanded && (job.description || job.rawJdText) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
              {/* Description */}
              <div>
                <p className="text-xs font-bold text-foreground mb-1.5">Job Description</p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.rawJdText || job.description}
                </p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-1.5">Responsibilities</p>
                  <ul className="space-y-1">
                    {job.responsibilities.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-brand-oxford mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills breakdown */}
              {job.jobSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-1.5">Skill Requirements</p>
                  <div className="space-y-2">
                    {['REQUIRED', 'PREFERRED'].map(type => {
                      const group = job.jobSkills.filter((s: any) => s.type === type);
                      if (!group.length) return null;
                      return (
                        <div key={type}>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            {type === 'REQUIRED' ? 'Required' : 'Preferred'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.map((s: any) => (
                              <SkillChip
                                key={s.skillId}
                                name={s.skill?.name ?? s.skillId}
                                variant={type === 'REQUIRED' ? 'solid' : 'outline'}
                                size="sm"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Eligibility */}
              {(job.minCgpa || job.maxBacklogs !== null || job.eligibleBranches?.length) && (
                <div>
                  <p className="text-xs font-bold text-foreground mb-1.5">Eligibility</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {job.minCgpa && <span>Min CGPA: <b className="text-foreground">{job.minCgpa}</b></span>}
                    {job.maxBacklogs !== null && job.maxBacklogs !== undefined && (
                      <span>Max Backlogs: <b className="text-foreground">{job.maxBacklogs}</b></span>
                    )}
                    {job.eligibleBranches?.length > 0 && (
                      <span>Branches: <b className="text-foreground">{job.eligibleBranches.join(', ')}</b></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RecruiterJobs() {
  const [showNew, setShowNew] = useState(false);
  const { data: liveJobs } = useJobs();
  const allJobs = liveJobs ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">My Job Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allJobs.length} posted positions</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-brand-oxford text-white px-3.5 py-2 rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" /> Post Job
        </button>
      </div>

      {showNew && <PostJobForm onClose={() => setShowNew(false)} />}

      {allJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted" description="Post your first job to start finding candidates." />
      ) : (
        <div className="space-y-4">
          {allJobs.map((job, i) => (
            <JobCard key={job.id} job={job} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
