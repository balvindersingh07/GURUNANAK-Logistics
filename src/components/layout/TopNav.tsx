import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface TopNavProps {
  title?: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export default function TopNav({ title, subtitle, onMenuClick, actions }: TopNavProps) {
  const { user } = useAuth();
  const { notifications } = useApp();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div>
          {title && <h1 className="text-xl font-bold text-navy">{title}</h1>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative rounded-xl p-2.5 hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} className="text-slate-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full rainbow-gradient text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <div
          className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full rainbow-gradient text-sm font-bold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-navy">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-navy">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
