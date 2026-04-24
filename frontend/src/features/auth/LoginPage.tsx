import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, EyeOff, GraduationCap, Shield, Building2, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/lib/api';
import { DEMO_CREDENTIALS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

type Role = 'STUDENT' | 'ADMIN' | 'RECRUITER';

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ElementType; color: string; active: string }> = {
  STUDENT: { label: 'Student', icon: GraduationCap, color: 'border-gray-200 text-muted-foreground', active: 'border-brand-oxford bg-brand-oxford text-white' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'border-gray-200 text-muted-foreground', active: 'border-brand-tan-500 bg-brand-tan-500 text-white' },
  RECRUITER: { label: 'Recruiter', icon: Building2, color: 'border-gray-200 text-muted-foreground', active: 'border-green-600 bg-green-600 text-white' },
};

function CopiedButton({ text, onCopy }: { text: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-1 text-brand-oxford hover:text-brand-oxford/70 transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function LoginPage() {
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        // apiPost unwraps { success, data } → returns { user, accessToken } directly
        const auth = await apiPost<{ user: { id: string; email: string; role: string }; accessToken: string }>(
          '/auth/login', data,
        );
        // Temporarily store token so the next call can auth
        localStorage.setItem('careerbridge_token', auth.accessToken);
        // Fetch display name from profile
        let name = auth.user.email.split('@')[0];
        try {
          if (auth.user.role === 'STUDENT') {
            const p = await apiGet<{ firstName: string; lastName: string }>('/students/me');
            name = `${p.firstName} ${p.lastName}`.trim();
          } else if (auth.user.role === 'RECRUITER') {
            const p = await apiGet<{ firstName?: string; lastName?: string; name?: string }>('/recruiters/me');
            name = (p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) || name;
          } else {
            const p = await apiGet<{ name?: string; firstName?: string; lastName?: string }>('/admin/me');
            name = (p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) || name;
          }
        } catch { /* profile fetch optional */ }
        return { user: { ...auth.user, name }, accessToken: auth.accessToken };
      } catch (err: any) {
        // Demo mode fallback when backend is unreachable or not deployed
        const status = err?.response?.status;
        const isBackendUnreachable =
          err?.code === 'ERR_NETWORK' ||
          err?.message?.includes('Network') ||
          err?.message?.includes('JSON') ||   // HTML returned instead of JSON
          !err?.response ||                    // no response at all
          status === 0 ||
          status === 404 ||                    // no backend route (frontend only deploy)
          status >= 500;
        if (isBackendUnreachable) {
          const { DEMO_CREDENTIALS: creds } = await import('@/lib/mock-data');
          const match = creds.find(c => c.email === data.email && c.password === data.password);
          if (match) {
            return {
              accessToken: 'demo-token-' + match.role,
              user: { id: 'demo-' + match.role, name: match.label, email: match.email, role: match.role },
            };
          }
        }
        throw err;
      }
    },
    onSuccess: (res: any) => {
      setAuth(res.user, res.accessToken);
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const dest = user.role === 'STUDENT' ? '/student' : user.role === 'ADMIN' ? '/admin' : '/recruiter';
    return <Navigate to={dest} replace />;
  }

  const demoCredentials = DEMO_CREDENTIALS.find(c => c.role === selectedRole) ?? DEMO_CREDENTIALS[0];

  const fillDemo = () => {
    setValue('email', demoCredentials.email);
    setValue('password', demoCredentials.password);
  };

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-oxford-50 via-white to-brand-tan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-oxford flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-oxford/20">
            <Sparkles className="w-6 h-6 text-brand-tan-300" />
          </div>
          <h1 className="text-xl font-black text-brand-oxford">DSU CareerBridge</h1>
          <p className="text-xs text-muted-foreground mt-1">AI-Powered Campus Placement Platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-border shadow-xl shadow-black/5 p-6"
        >
          <h2 className="text-base font-bold text-foreground mb-1">Sign in to your account</h2>
          <p className="text-xs text-muted-foreground mb-5">Select your role and enter your credentials</p>

          {/* Role Toggle */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all',
                  selectedRole === role ? cfg.active : cfg.color + ' hover:border-gray-300',
                )}
              >
                <cfg.icon className="w-4 h-4" strokeWidth={1.75} />
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Demo Credentials hint */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-brand-oxford/5 rounded-xl p-3 mb-5 overflow-hidden"
            >
              <p className="text-[11px] font-semibold text-brand-oxford mb-1.5">Demo credentials</p>
              <div className="space-y-1">
                <div className="flex items-center text-[11px] text-muted-foreground">
                  <span className="w-14 font-medium text-foreground">Email</span>
                  <span className="font-mono">{demoCredentials.email}</span>
                  <CopiedButton text={demoCredentials.email} onCopy={() => setValue('email', demoCredentials.email)} />
                </div>
                <div className="flex items-center text-[11px] text-muted-foreground">
                  <span className="w-14 font-medium text-foreground">Password</span>
                  <span className="font-mono">{demoCredentials.password}</span>
                  <CopiedButton text={demoCredentials.password} onCopy={() => setValue('password', demoCredentials.password)} />
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="mt-2 text-[11px] font-semibold text-brand-oxford hover:underline"
              >
                Fill automatically →
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@dsu.edu.in"
                autoComplete="email"
                className={cn(
                  'w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white outline-none transition-all',
                  'focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10',
                  errors.email ? 'border-red-400' : 'border-border',
                )}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full text-sm px-3.5 py-2.5 pr-10 rounded-xl border bg-white outline-none transition-all',
                    'focus:border-brand-oxford focus:ring-2 focus:ring-brand-oxford/10',
                    errors.password ? 'border-red-400' : 'border-border',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {loginMutation.isError && (
              <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2.5 rounded-lg border border-red-200">
                Invalid credentials. Use the demo credentials above.
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-brand-oxford text-white text-sm font-bold py-3 rounded-xl hover:bg-brand-oxford/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Dayananda Sagar University · Campus Placement Cell
        </p>
      </div>
    </div>
  );
}
