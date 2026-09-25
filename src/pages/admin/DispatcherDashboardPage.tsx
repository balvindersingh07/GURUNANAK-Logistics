import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  MapPin,
  Bell,
  Clock,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import type { Delivery } from '../../types';
import { STATUS_LABELS } from '../../types';

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr.slice(0, 10) === today;
}

function isDelayed(delivery: Delivery) {
  if (['delivered', 'cancelled'].includes(delivery.status)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return delivery.expectedDelivery.slice(0, 10) < today;
}

function OpsTable({
  deliveries,
  getCustomer,
  getDriver,
  showAssign = false,
}: {
  deliveries: Delivery[];
  getCustomer: (id: string) => { name: string } | undefined;
  getDriver: (id: string) => { name: string } | undefined;
  showAssign?: boolean;
}) {
  if (deliveries.length === 0) {
    return <p className="px-5 py-8 text-sm text-slate-500 text-center">No deliveries in this view.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Pickup</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Destination</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Driver</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">ETA</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deliveries.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{d.trackingId}</td>
              <td className="px-4 py-3">{getCustomer(d.customerId)?.name || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{d.pickupCity}</td>
              <td className="px-4 py-3 text-slate-600">{d.destinationCity}</td>
              <td className="px-4 py-3">{getDriver(d.driverId || '')?.name || 'Unassigned'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={d.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{d.eta || '—'}</td>
              <td className="px-4 py-3 text-right space-x-2">
                {showAssign && !d.driverId && (
                  <Link
                    to={`/deliveries/${d.id}`}
                    className="text-amber-600 hover:text-amber-700 font-medium text-xs"
                  >
                    Assign Driver
                  </Link>
                )}
                <Link
                  to={`/deliveries/${d.id}`}
                  className="text-violet-600 hover:text-violet-700 font-medium text-xs"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DispatcherDashboardPage() {
  const navigate = useNavigate();
  const { deliveries, getCustomer, getDriver } = useApp();

  const pendingCount = deliveries.filter((d) => d.status === 'pending').length;
  const unassignedCount = deliveries.filter(
    (d) => !d.driverId && !['delivered', 'cancelled'].includes(d.status),
  ).length;
  const assignedCount = deliveries.filter((d) => d.status === 'assigned').length;
  const inTransitCount = deliveries.filter((d) => d.status === 'in_transit').length;
  const outForDeliveryCount = deliveries.filter((d) => d.status === 'out_for_delivery').length;
  const deliveredTodayCount = deliveries.filter(
    (d) => d.status === 'delivered' && (isToday(d.lastUpdated) || isToday(d.createdDate)),
  ).length;

  const todaysOperations = useMemo(
    () =>
      deliveries
        .filter((d) => !['cancelled'].includes(d.status))
        .slice(0, 10),
    [deliveries],
  );

  const needsAssignment = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          !d.driverId &&
          ['pending', 'assigned'].includes(d.status),
      ),
    [deliveries],
  );

  const activeDeliveries = useMemo(
    () =>
      deliveries.filter((d) =>
        ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status),
      ),
    [deliveries],
  );

  const operationalAlerts = useMemo(() => {
    const alerts: { id: string; type: string; message: string; deliveryId: string }[] = [];

    deliveries
      .filter((d) => !d.driverId && d.status === 'pending')
      .forEach((d) => {
        alerts.push({
          id: `unassigned-${d.id}`,
          type: 'Unassigned delivery',
          message: `${d.trackingId} needs a driver assignment`,
          deliveryId: d.id,
        });
      });

    deliveries.filter(isDelayed).forEach((d) => {
      alerts.push({
        id: `delayed-${d.id}`,
        type: 'Delayed delivery',
        message: `${d.trackingId} is past expected delivery date`,
        deliveryId: d.id,
      });
    });

    deliveries
      .filter((d) => d.priority === 'urgent' && !['delivered', 'cancelled'].includes(d.status))
      .forEach((d) => {
        alerts.push({
          id: `urgent-${d.id}`,
          type: 'Requires attention',
          message: `Urgent delivery ${d.trackingId} (${STATUS_LABELS[d.status]})`,
          deliveryId: d.id,
        });
      });

    return alerts.slice(0, 8);
  }, [deliveries]);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        description="Today's delivery operations, driver assignment, and active shipment status"
        actions={
          <Button onClick={() => navigate('/deliveries/create')}>
            <Plus size={18} />
            Create Delivery
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard title="Pending" value={pendingCount} icon={Clock} accent={4} />
        <KPICard title="Unassigned" value={unassignedCount} icon={UserPlus} accent={5} />
        <KPICard title="Assigned" value={assignedCount} icon={Package} accent={0} />
        <KPICard title="In Transit" value={inTransitCount} icon={Truck} accent={1} />
        <KPICard title="Out for Delivery" value={outForDeliveryCount} icon={MapPin} accent={2} />
        <KPICard title="Delivered Today" value={deliveredTodayCount} icon={Package} accent={3} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Button variant="outline" className="justify-start" onClick={() => navigate('/deliveries/create')}>
          <Plus size={18} /> Create Delivery
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/deliveries')}>
          <Package size={18} /> Active Deliveries
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/tracking')}>
          <MapPin size={18} /> Live Tracking
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/deliveries')}>
          <Clock size={18} /> Delivery Status
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/notifications')}>
          <Bell size={18} /> Notifications
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => navigate(needsAssignment[0] ? `/deliveries/${needsAssignment[0].id}` : '/deliveries')}
        >
          <UserPlus size={18} /> Assign Driver
        </Button>
      </div>

      <div className="glass-card rainbow-border overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-navy">Today&apos;s Delivery Operations</h3>
          <Link
            to="/deliveries"
            className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <OpsTable
          deliveries={todaysOperations}
          getCustomer={getCustomer}
          getDriver={getDriver}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rainbow-border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-navy">Driver Assignment</h3>
            <p className="text-xs text-slate-500 mt-1">Pending and unassigned deliveries ready for assignment</p>
          </div>
          <OpsTable
            deliveries={needsAssignment}
            getCustomer={getCustomer}
            getDriver={getDriver}
            showAssign
          />
        </div>

        <div className="glass-card rainbow-border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-navy">Active Deliveries</h3>
            <p className="text-xs text-slate-500 mt-1">Assigned, picked up, in transit, and out for delivery</p>
          </div>
          <OpsTable
            deliveries={activeDeliveries}
            getCustomer={getCustomer}
            getDriver={getDriver}
          />
        </div>
      </div>

      <div className="glass-card rainbow-border overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-navy">Operational Alerts</h3>
        </div>
        {operationalAlerts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">No operational alerts right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {operationalAlerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/50">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{alert.type}</p>
                  <p className="text-sm text-slate-500">{alert.message}</p>
                </div>
                <Link
                  to={`/deliveries/${alert.deliveryId}`}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 shrink-0"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
