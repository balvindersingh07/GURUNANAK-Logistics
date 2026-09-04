import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Truck,
  Users,
  UserCircle,
  Route,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/deliveries', icon: Package, label: 'Deliveries' },
  { to: '/tracking', icon: MapPin, label: 'Live Tracking' },
  { to: '/fleet', icon: Truck, label: 'Fleet' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/customers', icon: UserCircle, label: 'Customers' },
  { to: '/routes', icon: Route, label: 'Routes' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const dispatcherNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/deliveries', icon: Package, label: 'Deliveries' },
  { to: '/tracking', icon: MapPin, label: 'Live Tracking' },
  { to: '/routes', icon: Route, label: 'Routes' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const customerNav = [
  { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customer/tracking', icon: MapPin, label: 'Track Delivery' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/support', icon: HelpCircle, label: 'Help & Support' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

const driverNav = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/delivery', icon: Package, label: 'Current Delivery' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/support', icon: HelpCircle, label: 'Help' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

function getNavForRole(role: UserRole) {
  if (role === 'customer') return customerNav;
  if (role === 'driver') return driverNav;
  if (role === 'dispatcher') return dispatcherNav;
  return adminNav;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user ? getNavForRole(user.role) : adminNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        {(!collapsed || mobileOpen) && <Logo size="nav" className="max-w-[170px]" />}
        {collapsed && !mobileOpen && (
          <div className="mx-auto">
            <Logo size="nav" showTagline={false} />
          </div>
        )}
        {mobileOpen && (
          <button type="button" onClick={onMobileClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        )}
        {!mobileOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'nav-active text-navy'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
              } ${collapsed && !mobileOpen ? 'justify-center' : ''}`
            }
          >
            <Icon size={20} className="shrink-0" />
            {(!collapsed || mobileOpen) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-1">
        {(user?.role === 'admin' || user?.role === 'dispatcher') && (
          <NavLink
            to="/support"
            onClick={onMobileClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <HelpCircle size={20} />
            {(!collapsed || mobileOpen) && <span>Help & Support</span>}
          </NavLink>
        )}
        <NavLink
          to="/profile"
          onClick={onMobileClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <UserCircle size={20} />
          {(!collapsed || mobileOpen) && <span>User Profile</span>}
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-navy/40 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col bg-white/95 backdrop-blur-xl border-r border-slate-100 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} w-64`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export function MobileBottomNav() {
  const { user } = useAuth();
  if (!user || (user.role !== 'driver' && user.role !== 'customer')) return null;

  const nav = getNavForRole(user.role).slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-xl py-2 lg:hidden">
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium ${
              isActive ? 'text-violet-600' : 'text-slate-500'
            }`
          }
        >
          <Icon size={20} />
          <span>{label.split(' ')[0]}</span>
        </NavLink>
      ))}
    </nav>
  );
}
