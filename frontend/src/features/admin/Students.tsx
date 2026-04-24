import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, GraduationCap, ChevronRight, Filter } from 'lucide-react';
import EligibilityBadge from '@/components/shared/EligibilityBadge';
import EmptyState from '@/components/shared/EmptyState';
import SkillChip from '@/components/shared/SkillChip';
import StudentInsightModal from '@/components/shared/StudentInsightModal';
import { useAdminStudents } from '@/hooks/api';
import { cn } from '@/lib/utils';

const TABS = ['All', 'Eligible', 'Partially Eligible', 'Not Eligible'];

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { data: liveStudents } = useAdminStudents();
  const students: any[] = liveStudents ?? [];

  const filtered = students.filter((s: any) => {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = name.includes(q) || (s.email ?? '').toLowerCase().includes(q) || (s.department ?? '').toLowerCase().includes(q);
    const cgpa = s.cgpa ?? 0;
    const backlogs = s.activeBacklogs ?? 0;
    const eligibility = cgpa >= 7 && backlogs === 0 ? 'ELIGIBLE' : backlogs > 0 && cgpa >= 6 ? 'PARTIALLY_ELIGIBLE' : 'INELIGIBLE';
    const matchTab = tab === 'All'
      || (tab === 'Eligible' && eligibility === 'ELIGIBLE')
      || (tab === 'Partially Eligible' && eligibility === 'PARTIALLY_ELIGIBLE')
      || (tab === 'Not Eligible' && eligibility === 'INELIGIBLE');
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} registered students</p>
        </div>
        <button className="text-xs font-semibold bg-brand-oxford text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5">
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, branch..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
          />
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold border border-border bg-white px-4 py-2.5 rounded-xl hover:border-brand-oxford/30">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap',
              tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="Try adjusting your search or filter." />
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  {['Student', 'Branch', 'CGPA', 'Backlogs', 'Eligibility', 'Skills', 'Applications', ''].map((h, i) => (
                    <th key={i} className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-oxford/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-oxford">{(s.firstName ?? 'S').charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="w-3 h-3" />{s.department}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-bold', (s.cgpa ?? 0) >= 8 ? 'text-green-600' : (s.cgpa ?? 0) >= 7 ? 'text-amber-600' : 'text-red-500')}>
                        {s.cgpa ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold', (s.activeBacklogs ?? 0) === 0 ? 'text-green-600' : 'text-red-500')}>
                        {s.activeBacklogs ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <EligibilityBadge status={
                        (s.cgpa ?? 0) >= 7 && (s.activeBacklogs ?? 0) === 0 ? 'ELIGIBLE'
                        : (s.activeBacklogs ?? 0) > 0 && (s.cgpa ?? 0) >= 6 ? 'PARTIALLY_ELIGIBLE'
                        : 'INELIGIBLE'
                      } />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.studentSkills ?? []).slice(0, 2).map((sk: any, idx: number) => (
                          <SkillChip key={idx} name={sk.skill?.name ?? sk.skillId ?? ''} size="sm" />
                        ))}
                        {(s.studentSkills ?? []).length > 2 && (
                          <span className="text-[11px] text-muted-foreground self-center">+{(s.studentSkills ?? []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">{s._count?.applications ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="text-xs font-semibold text-brand-oxford flex items-center gap-1 hover:underline"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StudentInsightModal
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent ?? {}}
        title="Student details"
        subtitle="Why this profile is eligible, partial, or not eligible"
      />
    </div>
  );
}
