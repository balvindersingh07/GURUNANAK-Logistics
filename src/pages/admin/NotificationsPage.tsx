import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Package, Truck, UserCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { NotificationType } from '../../types';

const typeIcons: Record<NotificationType, typeof Bell> = {
  delivery_update: Package,
  driver_assignment: UserCircle,
  vehicle_maintenance: Truck,
  customer_update: UserCircle,
  system_alert: AlertTriangle,
};

const typeColors: Record<NotificationType, string> = {
  delivery_update: 'bg-violet-100 text-violet-600',
  driver_assignment: 'bg-blue-100 text-blue-600',
  vehicle_maintenance: 'bg-amber-100 text-amber-600',
  customer_update: 'bg-emerald-100 text-emerald-600',
  system_alert: 'bg-red-100 text-red-600',
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    showToast('Notification marked as read', 'info');
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    showToast('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    showToast('Notification deleted', 'info');
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck size={18} /> Mark All Read
            </Button>
          ) : undefined
        }
      />

      {sorted.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {sorted.map((n) => {
            const Icon = typeIcons[n.type];
            return (
              <div
                key={n.id}
                className={`glass-card rainbow-border p-4 flex gap-4 transition-all ${
                  !n.read ? 'bg-violet-50/30' : ''
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColors[n.type]}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!n.read ? 'text-navy' : 'text-slate-600'}`}>{n.title}</p>
                      {!n.read && (
                        <span className="inline-block mt-1 h-2 w-2 rounded-full bg-violet-500" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                  {n.link && (
                    <Link to={n.link} className="mt-2 inline-block text-xs font-medium text-violet-600 hover:underline">
                      View details →
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
