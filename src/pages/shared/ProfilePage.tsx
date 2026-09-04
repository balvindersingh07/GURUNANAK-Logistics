import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, LogOut, Edit2, Shield, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import { FormField, inputClass } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setEditOpen(true);
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    setSaving(true);
    updateProfile({
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
    });
    setTimeout(() => {
      setSaving(false);
      setEditOpen(false);
      showToast('Profile updated successfully');
    }, 400);
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (passwordForm.current !== user?.password) {
      showToast('Current password is incorrect', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSaving(true);
    updateProfile({ password: passwordForm.newPassword });
    setTimeout(() => {
      setSaving(false);
      setPasswordOpen(false);
      setPasswordForm({ current: '', newPassword: '', confirm: '' });
      showToast('Password changed successfully');
    }, 400);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Profile" description="Manage your account settings" />

      <div className="glass-card rainbow-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl rainbow-gradient text-3xl font-bold text-white shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-navy">{user.name}</h3>
            <p className="text-sm text-slate-500 capitalize mt-0.5">{user.role} account</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600">
                <Mail size={16} className="text-violet-500 shrink-0" />
                {user.email}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600">
                <Phone size={16} className="text-cyan-500 shrink-0" />
                {user.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
          <Button variant="outline" onClick={openEdit}>
            <Edit2 size={18} />
            Edit Profile
          </Button>
          <Button variant="outline" onClick={() => setPasswordOpen(true)}>
            <Lock size={18} />
            Change Password
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      <div className="glass-card rainbow-border p-5">
        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          Account Security
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3">
            <span className="text-slate-600">Password</span>
            <span className="text-emerald-600 font-medium">••••••••</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3">
            <span className="text-slate-600">Role</span>
            <span className="font-medium text-navy capitalize">{user.role}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3">
            <span className="text-slate-600">Account ID</span>
            <span className="font-mono text-xs text-slate-500">{user.id}</span>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        footer={
          <ModalFooter
            onCancel={() => setEditOpen(false)}
            onConfirm={handleSaveProfile}
            confirmLabel="Save Changes"
            loading={saving}
          />
        }
      >
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={`${inputClass} pl-10`}
              />
            </div>
          </FormField>
          <FormField label="Email" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={`${inputClass} pl-10`}
              />
            </div>
          </FormField>
          <FormField label="Phone">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={`${inputClass} pl-10`}
              />
            </div>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change Password"
        footer={
          <ModalFooter
            onCancel={() => setPasswordOpen(false)}
            onConfirm={handleChangePassword}
            confirmLabel="Update Password"
            loading={saving}
          />
        }
      >
        <div className="space-y-4">
          <FormField label="Current Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className={`${inputClass} pl-10 pr-10`}
              />
            </div>
          </FormField>
          <FormField label="New Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`${inputClass} pl-10 pr-10`}
              />
            </div>
          </FormField>
          <FormField label="Confirm New Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className={`${inputClass} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
