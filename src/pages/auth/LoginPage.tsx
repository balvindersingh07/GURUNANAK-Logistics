import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { FormField, inputClass } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../components/layout/DashboardLayout';
import { DEMO_USERS } from '../../data/mockData';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        const stored = JSON.parse(localStorage.getItem('gnk_auth') || '{}');
        navigate(getDashboardPath(stored.role));
      } else {
        setErrors({ form: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginAsDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy">
        <div className="absolute inset-0 opacity-20 rainbow-gradient" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Logo size="xl" onDark className="mb-8 w-full" />
          <h2 className="text-3xl font-bold mb-4">Moving Every Delivery Forward</h2>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Enterprise-grade fleet management, real-time tracking, and logistics optimization
            across Rajasthan, Punjab, and Delhi NCR.
          </p>
          <div className="mt-12 relative h-64">
            <svg viewBox="0 0 400 200" className="w-full h-full opacity-80">
              <defs>
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>
              <path d="M20 150 Q100 100 200 130 T380 120" stroke="url(#roadGrad)" strokeWidth="4" fill="none" strokeDasharray="8 4" />
              <circle cx="80" cy="120" r="8" fill="#22C55E" opacity="0.8" />
              <circle cx="200" cy="130" r="10" fill="#3B82F6" opacity="0.9" />
              <circle cx="320" cy="115" r="8" fill="#EF4444" opacity="0.8" />
              <rect x="170" y="105" width="40" height="20" rx="4" fill="url(#roadGrad)" opacity="0.7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" className="justify-center w-full max-w-[320px] mx-auto" />
          </div>
          <div className="glass-card rainbow-border p-8">
            <h2 className="text-2xl font-bold text-navy mb-2">Welcome Back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your GURUNANAK account</p>

            {errors.form && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email" error={errors.email} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="admin@gurunanak.com"
                  />
                </div>
              </FormField>

              <FormField label="Password" error={errors.password} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormField>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-700">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleDemo}>
              Continue as Demo User
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-violet-600 hover:text-violet-700">
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-500">Demo accounts</p>
            {DEMO_USERS.map((demoUser) => (
              <p key={demoUser.id}>
                {demoUser.role.charAt(0).toUpperCase() + demoUser.role.slice(1)}:{' '}
                {demoUser.email} / {demoUser.password}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
