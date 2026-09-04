import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  Plus,
  MapPin,
  UserPlus,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/layout/TopNav';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { STATUS_LABELS, DELIVERY_STATUSES } from '../../types';

const PIE_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#94A3B8'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { deliveries, drivers, vehicles, getCustomer } = useApp();

  const activeDeliveries = deliveries.filter(
    (d) => !['delivered', 'cancelled'].includes(d.status),
  ).length;
  const deliveredToday = deliveries.filter((d) => d.status === 'delivered').length;
  const availableFleet = vehicles.filter((v) => v.status === 'available').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'on_delivery').length;

  const statusChartData = useMemo(
    () =>
      DELIVERY_STATUSES.map((s) => ({
        name: STATUS_LABELS[s],
        count: deliveries.filter((d) => d.status === s).length,
      })),
    [deliveries],
  );

  const fleetChartData = useMemo(() => {
    const counts = { available: 0, on_trip: 0, maintenance: 0, inactive: 0 };
    vehicles.forEach((v) => {
      counts[v.status]++;
    });
    return [
      { name: 'Available', value: counts.available },
      { name: 'On Trip', value: counts.on_trip },
      { name: 'Maintenance', value: counts.maintenance },
      { name: 'Inactive', value: counts.inactive },
    ].filter((d) => d.value > 0);
  }, [vehicles]);

  const recentDeliveries = deliveries.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of GURUNANAK logistics operations across Rajasthan, Punjab & Delhi NCR"
        actions={
          <Button onClick={() => navigate('/deliveries/create')}>
            <Plus size={18} />
            New Delivery
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard title="Active Deliveries" value={activeDeliveries} icon={Package} accent={0} trend="+12% this week" />
        <KPICard title="Delivered" value={deliveredToday} icon={TrendingUp} accent={3} trend="On schedule" />
        <KPICard title="Fleet Available" value={`${availableFleet}/${vehicles.length}`} icon={Truck} accent={1} />
        <KPICard title="Drivers On Duty" value={driversOnDuty} icon={Users} accent={2} trend={`${drivers.length} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Deliveries by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Fleet Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={fleetChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {fleetChartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Button variant="outline" className="justify-start" onClick={() => navigate('/deliveries/create')}>
          <Plus size={18} /> Create Delivery
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/tracking')}>
          <MapPin size={18} /> Live Tracking
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/drivers')}>
          <UserPlus size={18} /> Manage Drivers
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/reports')}>
          <BarChart3 size={18} /> View Reports
        </Button>
      </div>

      <div className="glass-card rainbow-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-navy">Recent Deliveries</h3>
          <Link to="/deliveries" className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Route</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">ETA</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{d.trackingId}</td>
                  <td className="px-4 py-3">{getCustomer(d.customerId)?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.pickupCity} → {d.destinationCity}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{d.eta || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/deliveries/${d.id}`}
                      className="text-violet-600 hover:text-violet-700 font-medium text-xs"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
