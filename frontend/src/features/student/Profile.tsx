import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, GraduationCap, Linkedin, Github, Globe, X, Edit2, Save } from 'lucide-react';
import SectionCard from '@/components/shared/SectionCard';
import SkillChip from '@/components/shared/SkillChip';
import { MOCK_STUDENT } from '@/lib/mock-data';
import { useStudentProfile, useUpdateStudentProfile } from '@/hooks/api';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none transition-all focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10';

export default function StudentProfile() {
  const [editing, setEditing] = useState(false);

  const { data: profile } = useStudentProfile();
  const updateMutation = useUpdateStudentProfile();

  const student = profile ?? MOCK_STUDENT;
  const projects = (student as any).projects ?? [];
  const certifications = (student as any).certifications ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: student.phone ?? '',
      linkedinUrl: student.linkedinUrl ?? '',
      githubUrl: student.githubUrl ?? '',
      portfolioUrl: student.portfolioUrl ?? '',
      bio: (student as any).bio ?? '',
    },
  });

  // Reset form when profile loads from API
  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone ?? '',
        linkedinUrl: profile.linkedinUrl ?? '',
        githubUrl: profile.githubUrl ?? '',
        portfolioUrl: profile.portfolioUrl ?? '',
        bio: (profile as any).bio ?? '',
      });
    }
  }, [profile, reset]);

  const onSave = (data: ProfileForm) => {
    updateMutation.mutate(data as any, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your personal and academic information</p>
        </div>
        <button
          onClick={() => editing ? handleSubmit(onSave)() : setEditing(true)}
          disabled={updateMutation.isPending}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-60',
            editing ? 'bg-brand-oxford text-white' : 'bg-brand-oxford/8 text-brand-oxford hover:bg-brand-oxford/15',
          )}
        >
          {updateMutation.isPending
            ? 'Saving...'
            : editing
              ? <><Save className="w-3.5 h-3.5" /> Save Changes</>
              : <><Edit2 className="w-3.5 h-3.5" /> Edit Profile</>
          }
        </button>
      </div>

      {/* Avatar + basic */}
      <SectionCard title="Personal Information" icon={User}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-oxford/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-brand-oxford">{student.firstName?.charAt(0)}</span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                value={`${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()}
                disabled
                className={cn(inputClass, 'bg-gray-50 text-muted-foreground')}
              />
            </Field>
            <Field label="Email">
              <input value={student.email ?? ''} disabled className={cn(inputClass, 'bg-gray-50 text-muted-foreground')} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} disabled={!editing} placeholder="+91 9876543210" className={cn(inputClass, !editing && 'bg-gray-50 text-muted-foreground')} />
            </Field>
            <Field label="Student ID (USN)">
              <input value={student.usn ?? ''} disabled className={cn(inputClass, 'bg-gray-50 text-muted-foreground')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio / About" error={errors.bio?.message}>
                <textarea {...register('bio')} disabled={!editing} rows={3} placeholder="Brief introduction..." className={cn(inputClass, !editing && 'bg-gray-50 text-muted-foreground', 'resize-none')} />
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Academic */}
      <SectionCard title="Academic Details" icon={GraduationCap}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Department', value: student.department },
            { label: 'Semester', value: student.semester ? `Semester ${student.semester}` : '—' },
            { label: 'Graduation Year', value: student.expectedGraduationYear },
            { label: 'CGPA', value: student.cgpa },
            { label: 'Active Backlogs', value: student.activeBacklogs ?? 0 },
            { label: 'USN', value: student.usn ?? '—' },
          ].map((f, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{f.value ?? '—'}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Links */}
      <SectionCard title="Social Links" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LinkedIn URL" error={errors.linkedinUrl?.message}>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input {...register('linkedinUrl')} disabled={!editing} placeholder="https://linkedin.com/in/..." className={cn(inputClass, 'pl-9', !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
          </Field>
          <Field label="GitHub URL" error={errors.githubUrl?.message}>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input {...register('githubUrl')} disabled={!editing} placeholder="https://github.com/..." className={cn(inputClass, 'pl-9', !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
          </Field>
          <Field label="Portfolio URL" error={errors.portfolioUrl?.message}>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input {...register('portfolioUrl')} disabled={!editing} placeholder="https://yoursite.com" className={cn(inputClass, 'pl-9', !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Skills">
        <div className="flex flex-wrap gap-2">
          {student.studentSkills?.map((s, i) => (
            <div key={i} className="relative group">
              <SkillChip name={s.skill?.name ?? s.skillId} confidence={s.confidence} />
              {editing && (
                <button className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center">
                  <X className="w-2 h-2" />
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Projects */}
      <SectionCard title="Projects">
        <div className="space-y-4">
          {projects.map((p: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="p-4 rounded-xl bg-gray-50/80 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                </div>
                {editing && <button className="text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>}
              </div>
              {p.techStack && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(p.techStack as string[]).slice(0, 5).map((t, j) => (
                    <SkillChip key={j} name={t} variant="outline" size="sm" />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Certifications */}
      <SectionCard title="Certifications">
        <div className="space-y-3">
          {certifications.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.issuingOrganization} · {c.issueDate ? new Date(c.issueDate).getFullYear() : ''}</p>
              </div>
              {c.credentialUrl && (
                <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-oxford hover:underline">
                  Verify
                </a>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
