import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as UserRole,
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.terms) e.terms = 'You must accept terms & conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
    });
    if (result.success) {
      showToast('Account created successfully! Please sign in.');
      navigate('/login');
    } else {
      setErrors({ form: result.error || 'Registration failed' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center w-full max-w-[280px] mx-auto" />
        </div>
        <div className="glass-card rainbow-border p-8">
          <h2 className="text-2xl font-bold text-navy mb-2">Create Account</h2>
          <p className="text-sm text-slate-500 mb-6">Join GURUNANAK Transportation & Logistics</p>

          {errors.form && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" error={errors.name} required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rajesh Kumar"
              />
            </FormField>
            <FormField label="Email" error={errors.email} required>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
            <FormField label="Phone" error={errors.phone} required>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Password" error={errors.password} required>
                <input
                  type="password"
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </FormField>
              <FormField label="Confirm Password" error={errors.confirmPassword} required>
                <input
                  type="password"
                  className={inputClass}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Role" required>
              <select
                className={selectClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
              </select>
            </FormField>
            <FormField label="Terms & Conditions" error={errors.terms}>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                  className="mt-1 rounded"
                />
                I agree to the Terms & Conditions and Privacy Policy
              </label>
            </FormField>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-violet-600">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
