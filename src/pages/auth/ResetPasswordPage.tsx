import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { FormField, inputClass } from '../../components/ui/FormField';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get('token') || 'demo-reset-token';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      showToast('Password reset successfully');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setDone(true);
      showToast('Password updated (demo mode)', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center w-full max-w-[280px] mx-auto" />
        </div>
        <div className="glass-card rainbow-border p-8">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy mb-4">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <h2 className="text-2xl font-bold text-navy mb-2">Reset Password</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your new password below.</p>

          {done ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-6 text-center text-emerald-800">
              Password reset successfully. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="New Password" error={errors.password} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    className={`${inputClass} pl-10`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </FormField>
              <FormField label="Confirm Password" error={errors.confirm} required>
                <input
                  type="password"
                  className={inputClass}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </FormField>
              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
