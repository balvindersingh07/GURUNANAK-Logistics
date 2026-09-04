import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { FormField, inputClass } from '../../components/ui/FormField';
import { authService } from '../../services/authService';
import { checkApiHealth } from '../../services/api';

const GENERIC_SUCCESS =
  'If the account exists, a password reset request has been processed.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const online = await checkApiHealth();
      if (online) {
        await authService.forgotPassword(email.trim().toLowerCase());
      }
    } catch {
      // Always show generic success — do not reveal account existence
    } finally {
      setLoading(false);
      setSent(true);
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
          <h2 className="text-2xl font-bold text-navy mb-2">Forgot Password</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-6 text-center">
              <p className="text-emerald-800 font-medium">{GENERIC_SUCCESS}</p>
              <p className="text-sm text-emerald-600 mt-2">
                If you have an account, check your inbox for further instructions.
              </p>
              <Link to="/login" className="inline-block mt-4 text-sm font-medium text-violet-600">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email" error={error} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    className={`${inputClass} pl-10`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </FormField>
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
