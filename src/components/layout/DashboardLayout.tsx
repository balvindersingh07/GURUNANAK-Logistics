import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar, { MobileBottomNav } from './Sidebar';
import TopNav from './TopNav';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}

export default function DashboardLayout({ title, subtitle, actions }: DashboardLayoutProps) {
  const { user, authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (authLoading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const marginClass = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`${marginClass} transition-all duration-300 pb-20 lg:pb-0`}>
        <TopNav
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
          actions={actions}
        />
        <main className="p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const redirect =
      user.role === 'customer'
        ? '/customer/dashboard'
        : user.role === 'driver'
          ? '/driver/dashboard'
          : '/dashboard';
    return <Navigate to={redirect} replace />;
  }
  return null;
}

export function getDashboardPath(role: string) {
  if (role === 'customer') return '/customer/dashboard';
  if (role === 'driver') return '/driver/dashboard';
  return '/dashboard';
}
