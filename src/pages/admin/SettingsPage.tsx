import { useState } from 'react';
import { User, Building2, Bell, Shield, Users } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import { FormField, inputClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type Tab = 'profile' | 'company' | 'notifications' | 'security' | 'roles';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'roles', label: 'Role & Permissions', icon: Users },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [company, setCompany] = useState({
    companyName: settings.companyName,
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone,
    address: settings.address,
  });

  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
    pushNotifications: settings.pushNotifications,
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: settings.twoFactorEnabled,
  });

  const handleSaveProfile = () => {
    updateProfile(profile);
    showToast('Profile updated successfully');
  };

  const handleSaveCompany = () => {
    updateSettings(company);
    showToast('Company settings saved');
  };

  const handleSaveNotifications = () => {
    updateSettings(notifPrefs);
    showToast('Notification preferences saved');
  };

  const handleSaveSecurity = () => {
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    updateSettings({ twoFactorEnabled: security.twoFactorEnabled });
    showToast(security.newPassword ? 'Password updated successfully' : 'Security settings saved');
    setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 cursor-pointer">
      <span className="text-sm font-medium text-navy">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-violet-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and platform preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="glass-card rainbow-border p-2 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'rainbow-gradient text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 glass-card rainbow-border p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-lg font-semibold text-navy">Profile Settings</h3>
              <FormField label="Full Name">
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Email">
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Phone">
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputClass} />
              </FormField>
              <Button onClick={handleSaveProfile}>Save Profile</Button>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-lg font-semibold text-navy">Company Information</h3>
              <FormField label="Company Name">
                <input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Company Email">
                <input type="email" value={company.companyEmail} onChange={(e) => setCompany({ ...company, companyEmail: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Company Phone">
                <input value={company.companyPhone} onChange={(e) => setCompany({ ...company, companyPhone: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Address">
                <input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className={inputClass} />
              </FormField>
              <Button onClick={handleSaveCompany}>Save Company Settings</Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-lg font-semibold text-navy">Notification Preferences</h3>
              <div className="space-y-3">
                <Toggle
                  label="Email Notifications"
                  checked={notifPrefs.emailNotifications}
                  onChange={(v) => setNotifPrefs({ ...notifPrefs, emailNotifications: v })}
                />
                <Toggle
                  label="SMS Notifications"
                  checked={notifPrefs.smsNotifications}
                  onChange={(v) => setNotifPrefs({ ...notifPrefs, smsNotifications: v })}
                />
                <Toggle
                  label="Push Notifications"
                  checked={notifPrefs.pushNotifications}
                  onChange={(v) => setNotifPrefs({ ...notifPrefs, pushNotifications: v })}
                />
              </div>
              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-lg font-semibold text-navy">Security</h3>
              <FormField label="Current Password">
                <input type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="New Password">
                <input type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Confirm New Password">
                <input type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} className={inputClass} />
              </FormField>
              <Toggle
                label="Two-Factor Authentication"
                checked={security.twoFactorEnabled}
                onChange={(v) => setSecurity({ ...security, twoFactorEnabled: v })}
              />
              <Button onClick={handleSaveSecurity}>Save Security Settings</Button>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-navy">Role & Permissions</h3>
              <p className="text-sm text-slate-500">Manage access levels for GURUNANAK platform users</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Deliveries</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Fleet</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Reports</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { role: 'Admin', deliveries: 'Full', fleet: 'Full', reports: 'Full', settings: 'Full' },
                      { role: 'Dispatcher', deliveries: 'Full', fleet: 'View', reports: 'View', settings: 'None' },
                      { role: 'Driver', deliveries: 'Assigned', fleet: 'None', reports: 'None', settings: 'Profile' },
                      { role: 'Customer', deliveries: 'Own', fleet: 'None', reports: 'None', settings: 'Profile' },
                    ].map((r) => (
                      <tr key={r.role} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-navy">{r.role}</td>
                        <td className="px-4 py-3">{r.deliveries}</td>
                        <td className="px-4 py-3">{r.fleet}</td>
                        <td className="px-4 py-3">{r.reports}</td>
                        <td className="px-4 py-3">{r.settings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400">
                Your current role: <span className="font-medium capitalize text-violet-600">{user?.role}</span>
              </p>
              <Button onClick={() => showToast('Role permissions are managed by system administrator', 'info')}>
                Save Permissions
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
