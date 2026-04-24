import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, Globe, Mail, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/shared/EmptyState';
import { useAdminCompanies } from '@/hooks/api';
import { cn } from '@/lib/utils';

export default function AdminCompanies() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: liveCompanies } = useAdminCompanies();
  const allCompanies = liveCompanies ?? [];

  const filtered = allCompanies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-oxford">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allCompanies.length} partner companies</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold bg-brand-oxford text-white px-3.5 py-2 rounded-xl">
          <Plus className="w-3.5 h-3.5" /> Add Company
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white outline-none focus:border-brand-oxford transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-md hover:border-brand-oxford/20 transition-all cursor-pointer"
                onClick={() => navigate(`/admin/jobs?companyId=${encodeURIComponent(company.id)}`)}
              >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-oxford/8 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-oxford" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Active
                </span>
              </div>

              {company.description && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{company.description}</p>
              )}

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand-oxford transition-colors"
                  >
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
                {company.hrEmail && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Mail className="w-3 h-3" />{company.hrEmail}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/jobs?companyId=${encodeURIComponent(company.id)}`);
                  }}
                  className="ml-auto text-[11px] font-semibold text-brand-oxford flex items-center gap-0.5 cursor-pointer hover:underline"
                >
                  View jobs <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
