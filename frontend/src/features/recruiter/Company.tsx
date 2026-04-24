import { useState } from 'react';
import { Building2, Globe, Mail, Phone, MapPin, Edit2, Save } from 'lucide-react';
import SectionCard from '@/components/shared/SectionCard';
import { useCompany, useMe } from '@/hooks/api';
import { cn } from '@/lib/utils';

const inputClass = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-border bg-white outline-none transition-all focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10';

export default function RecruiterCompany() {
  const [editing, setEditing] = useState(false);
  const { data: me } = useMe();
  const companyId = me?.recruiterProfile?.company?.id;
  const { data: company } = useCompany(companyId ?? '');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">Company Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your company information visible to students</p>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors',
            editing ? 'bg-brand-oxford text-white' : 'bg-brand-oxford/8 text-brand-oxford hover:bg-brand-oxford/15',
          )}
        >
          {editing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit2 className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      <SectionCard title="Company Details" icon={Building2}>
        {!companyId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No company is linked to this recruiter account yet. Attach a company profile to enable job posting from this account.
          </div>
        ) : !company ? (
          <div className="rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm text-muted-foreground">
            Loading company profile...
          </div>
        ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-oxford/8 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-brand-oxford" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-black text-brand-oxford">{company.name}</p>
              <p className="text-sm text-muted-foreground">{company.industry}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Company Name</label>
              <input defaultValue={company.name} disabled={!editing} className={cn(inputClass, !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Industry</label>
              <input defaultValue={company.industry ?? ''} disabled={!editing} className={cn(inputClass, !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">HR Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input defaultValue={company.hrEmail ?? ''} disabled={!editing} className={cn(inputClass, 'pl-9', !editing && 'bg-gray-50 text-muted-foreground')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input defaultValue={company.website ?? ''} disabled={!editing} className={cn(inputClass, 'pl-9', !editing && 'bg-gray-50 text-muted-foreground')} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">About</label>
              <textarea defaultValue={company.description ?? ''} disabled={!editing} rows={4} className={cn(inputClass, 'resize-none', !editing && 'bg-gray-50 text-muted-foreground')} />
            </div>
          </div>
        </div>
        )}
      </SectionCard>
    </div>
  );
}
