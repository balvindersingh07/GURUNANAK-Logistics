import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  Truck,
  Navigation,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { DeliveryStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { hasRequiredProof } from '../../utils/proofRequirements';

const STATUS_ACTIONS: {
  label: string;
  from: DeliveryStatus[];
  to: DeliveryStatus;
}[] = [
  { label: 'Start Delivery', from: ['assigned'], to: 'picked_up' },
  { label: 'Mark Picked Up', from: ['assigned'], to: 'picked_up' },
  { label: 'Start Transit', from: ['picked_up'], to: 'in_transit' },
  { label: 'Out for Delivery', from: ['in_transit'], to: 'out_for_delivery' },
  { label: 'Mark Delivered', from: ['out_for_delivery'], to: 'delivered' },
];

function getNextAction(status: DeliveryStatus) {
  if (status === 'assigned') return STATUS_ACTIONS[0];
  if (status === 'picked_up') return STATUS_ACTIONS[2];
  if (status === 'in_transit') return STATUS_ACTIONS[3];
  if (status === 'out_for_delivery') return STATUS_ACTIONS[4];
  return null;
}

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deliveries, drivers, updateDeliveryStatus, getCustomer, getProofOfDelivery } = useApp();
  const { showToast } = useToast();

  const driver = useMemo(
    () => drivers.find((d) => d.email.toLowerCase() === user?.email.toLowerCase()),
    [drivers, user],
  );

  const myDeliveries = useMemo(
    () => (driver ? deliveries.filter((d) => d.driverId === driver.id) : []),
    [deliveries, driver],
  );

  const today = new Date().toISOString().split('T')[0];
  const todayDeliveries = myDeliveries.filter(
    (d) => d.createdDate === today || d.expectedDelivery === today || !['delivered', 'cancelled'].includes(d.status),
  );

  const currentDelivery = useMemo(() => {
    if (driver?.currentDeliveryId) {
      return deliveries.find((d) => d.id === driver.currentDeliveryId);
    }
    return myDeliveries.find((d) => !['delivered', 'cancelled'].includes(d.status));
  }, [driver, deliveries, myDeliveries]);

  const completedToday = myDeliveries.filter(
    (d) => d.status === 'delivered' && d.lastUpdated?.startsWith(today),
  ).length;
  const activeToday = myDeliveries.filter(
    (d) => !['delivered', 'cancelled'].includes(d.status),
  ).length;
  const pendingToday = myDeliveries.filter((d) =>
    ['assigned', 'pending'].includes(d.status),
  ).length;

  const nextAction = currentDelivery ? getNextAction(currentDelivery.status) : null;

  const handleStatusUpdate = async (to: DeliveryStatus, label: string) => {
    if (!currentDelivery) return;
    try {
      await updateDeliveryStatus(currentDelivery.id, to);
      showToast(`${label} — ${STATUS_LABELS[to]}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  const handleActionClick = (action: (typeof STATUS_ACTIONS)[number]) => {
    if (!currentDelivery || !action.from.includes(currentDelivery.status)) {
      showToast('This action is not available for the current status', 'error');
      return;
    }
    if (action.label === 'Mark Picked Up' && currentDelivery.status === 'picked_up') {
      showToast('Package already marked as picked up', 'info');
      return;
    }
    if (action.to === 'delivered' && !hasRequiredProof(getProofOfDelivery(currentDelivery.id))) {
      showToast('Complete proof of delivery (photo + signature) first', 'error');
      navigate(`/driver/delivery/${currentDelivery.id}`);
      return;
    }
    handleStatusUpdate(action.to, action.label);
  };

  return (
    <div className="max-w-lg mx-auto lg:max-w-none">
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'Driver'}`}
        description="Your deliveries for today"
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPICard title="Active" value={activeToday} icon={Truck} accent={1} />
        <KPICard title="Done" value={completedToday} icon={CheckCircle} accent={3} />
        <KPICard title="Pending" value={pendingToday} icon={Clock} accent={4} />
      </div>

      {currentDelivery ? (
        <div className="glass-card rainbow-border p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy">Current Delivery</h3>
            <StatusBadge status={currentDelivery.status} />
          </div>
          <p className="font-mono text-sm font-medium text-violet-600">{currentDelivery.trackingId}</p>
          <p className="text-sm text-slate-600 mt-1">
            {currentDelivery.pickupCity} → {currentDelivery.destinationCity}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Customer: {getCustomer(currentDelivery.customerId)?.name || '—'}
          </p>
          <p className="text-xs text-slate-500">{currentDelivery.destination}</p>

          {nextAction && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => handleActionClick(nextAction)}
            >
              <Navigation size={18} />
              {nextAction.label}
            </Button>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status Actions</p>
            <div className="grid grid-cols-1 gap-2">
              {STATUS_ACTIONS.map((action) => {
                const enabled =
                  currentDelivery &&
                  action.from.includes(currentDelivery.status) &&
                  !(action.label === 'Mark Picked Up' && currentDelivery.status === 'picked_up');
                const isNext = nextAction?.label === action.label;
                return (
                  <Button
                    key={action.label}
                    variant={isNext && enabled ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    disabled={!enabled}
                    onClick={() => handleActionClick(action)}
                  >
                    <Package size={16} />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => navigate(`/driver/delivery/${currentDelivery.id}`)}
          >
            View full details <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No active delivery"
          description="You don't have any deliveries assigned right now. Check back later."
        />
      )}

      {todayDeliveries.length > 0 && (
        <div className="glass-card rainbow-border overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-navy text-sm">Today&apos;s Summary</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {todayDeliveries.slice(0, 5).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(`/driver/delivery/${d.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-medium text-navy truncate">{d.trackingId}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {d.pickupCity} → {d.destinationCity}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
