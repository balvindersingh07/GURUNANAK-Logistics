import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Clock, Search, ArrowRight, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deliveries, customers } = useApp();
  const { showToast } = useToast();
  const [trackingSearch, setTrackingSearch] = useState('');

  const customer = useMemo(
    () => customers.find((c) => c.email.toLowerCase() === user?.email.toLowerCase()),
    [customers, user],
  );

  const myDeliveries = useMemo(
    () =>
      customer
        ? deliveries.filter((d) => d.customerId === customer.id)
        : deliveries.filter((d) =>
            user?.email ? d.trackingId.toLowerCase().includes(user.email.split('@')[0].slice(0, 3)) : false,
          ),
    [deliveries, customer, user],
  );

  const activeCount = myDeliveries.filter(
    (d) => !['delivered', 'cancelled'].includes(d.status),
  ).length;
  const deliveredCount = myDeliveries.filter((d) => d.status === 'delivered').length;
  const pendingCount = myDeliveries.filter((d) =>
    ['pending', 'assigned'].includes(d.status),
  ).length;

  const recentDeliveries = myDeliveries.slice(0, 6);

  const handleTrackSearch = () => {
    const q = trackingSearch.trim();
    if (!q) {
      showToast('Please enter a tracking ID', 'error');
      return;
    }
    const found = deliveries.find((d) => d.trackingId.toLowerCase() === q.toLowerCase());
    if (!found) {
      showToast('Tracking ID not found. Please check and try again.', 'error');
      return;
    }
    navigate(`/customer/tracking/${found.trackingId}`);
  };

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Customer'}`}
        description="Track your shipments and manage deliveries with GURUNANAK Logistics"
      />

      <div className="glass-card rainbow-border p-5 mb-6">
        <h3 className="text-lg font-semibold text-navy mb-1">Track a Shipment</h3>
        <p className="text-sm text-slate-500 mb-4">Enter your tracking ID to view real-time delivery status</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={trackingSearch}
            onChange={setTrackingSearch}
            placeholder="e.g. GNK20260301001"
            className="flex-1"
          />
          <Button onClick={handleTrackSearch} className="shrink-0">
            <Search size={18} />
            Track
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Active" value={activeCount} icon={Package} accent={0} />
        <KPICard title="Delivered" value={deliveredCount} icon={CheckCircle} accent={3} />
        <KPICard title="Pending" value={pendingCount} icon={Clock} accent={4} />
      </div>

      <div className="glass-card rainbow-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-navy">Recent Deliveries</h3>
          <Link
            to="/customer/tracking"
            className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            Track all <ArrowRight size={14} />
          </Link>
        </div>

        {recentDeliveries.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No deliveries yet"
            description="Your shipment history will appear here once you have active orders."
            action={
              <Button variant="outline" onClick={() => navigate('/customer/tracking')}>
                <MapPin size={18} /> Track a Delivery
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDeliveries.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(`/customer/tracking/${d.trackingId}`)}
                className="w-full text-left px-5 py-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-navy">{d.trackingId}</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {d.pickupCity} → {d.destinationCity}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{d.packageType} · {d.weight}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={d.status} />
                  {d.eta && d.status !== 'delivered' && (
                    <span className="text-xs text-slate-500">ETA {d.eta}</span>
                  )}
                  <ArrowRight size={16} className="text-violet-400 hidden sm:block" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
