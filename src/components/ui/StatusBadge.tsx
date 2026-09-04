import type { DeliveryStatus, DriverStatus, VehicleStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types';

type BadgeStatus = DeliveryStatus | DriverStatus | VehicleStatus | string;

const extraLabels: Record<string, string> = {
  available: 'Available',
  on_delivery: 'On Delivery',
  offline: 'Offline',
  on_trip: 'On Trip',
  maintenance: 'Maintenance',
  inactive: 'Inactive',
  active: 'Active',
  scheduled: 'Scheduled',
  completed: 'Completed',
  open: 'Open',
  resolved: 'Resolved',
};

const extraColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  on_delivery: 'bg-blue-100 text-blue-800',
  offline: 'bg-slate-100 text-slate-600',
  on_trip: 'bg-cyan-100 text-cyan-800',
  maintenance: 'bg-amber-100 text-amber-800',
  inactive: 'bg-slate-100 text-slate-500',
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  open: 'bg-orange-100 text-orange-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  const label = STATUS_LABELS[status as DeliveryStatus] || extraLabels[status] || status;
  const color =
    STATUS_COLORS[status as DeliveryStatus] || extraColors[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
