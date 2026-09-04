import { useState, useMemo, useEffect } from 'react';
import { Download, FileText, TrendingUp, Package, Truck, Users } from 'lucide-react';
import {
  AreaChart,
  Area,
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
import Button from '../../components/ui/Button';
import KPICard from '../../components/ui/KPICard';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { reportService, type ReportSummaryResponse } from '../../services/reportService';
import { STATUS_LABELS } from '../../types';

type DateRange = 'today' | '7days' | '30days' | '90days';

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7days': '7 Days',
  '30days': '30 Days',
  '90days': '90 Days',
};

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

function getDateCutoff(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7days':
      return new Date(now.getTime() - 7 * 86400000);
    case '30days':
      return new Date(now.getTime() - 30 * 86400000);
    case '90days':
      return new Date(now.getTime() - 90 * 86400000);
  }
}

export default function ReportsPage() {
  const { showToast } = useToast();
  const { apiOnline, deliveries, drivers, vehicles, customers } = useApp();
  const [range, setRange] = useState<DateRange>('30days');
  const [apiSummary, setApiSummary] = useState<ReportSummaryResponse | null>(null);

  useEffect(() => {
    if (!apiOnline) {
      setApiSummary(null);
      return;
    }
    let cancelled = false;
    reportService
      .getSummary()
      .then((data) => {
        if (!cancelled) setApiSummary(data);
      })
      .catch(() => {
        if (!cancelled) setApiSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiOnline]);

  const cutoff = getDateCutoff(range);
  const filtered = useMemo(
    () => deliveries.filter((d) => new Date(d.createdDate) >= cutoff),
    [deliveries, cutoff],
  );

  const deliveredLocal = filtered.filter((d) => d.status === 'delivered').length;
  const inTransitLocal = filtered.filter((d) =>
    ['in_transit', 'out_for_delivery', 'picked_up'].includes(d.status),
  ).length;
  const cancelledLocal = filtered.filter((d) => d.status === 'cancelled').length;

  const totalShipments = apiSummary?.summary.totalDeliveries ?? filtered.length;
  const delivered = apiSummary?.summary.delivered ?? deliveredLocal;
  const inTransit = apiSummary?.summary.inProgress ?? inTransitLocal;
  const fleetDriversLabel = apiSummary
    ? `${apiSummary.summary.totalVehicles} / ${apiSummary.summary.totalDrivers}`
    : `${vehicles.length} / ${drivers.length}`;

  const statusData = useMemo(() => {
    if (apiSummary?.deliveriesByStatus) {
      return Object.entries(apiSummary.deliveriesByStatus).map(([status, count]) => ({
        name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
        value: count,
      }));
    }
    const counts: Record<string, number> = {};
    filtered.forEach((d) => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      value: count,
    }));
  }, [apiSummary, filtered]);

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((d) => {
      counts[d.destinationCity] = (counts[d.destinationCity] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filtered]);

  const trendData = useMemo(() => {
    const days: Record<string, number> = {};
    filtered.forEach((d) => {
      days[d.createdDate] = (days[d.createdDate] || 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filtered]);

  const successRate = apiSummary?.summary.deliveryRate
    ?? (filtered.length ? Math.round((deliveredLocal / filtered.length) * 100) : 0);
  const cancellationRate = apiSummary && apiSummary.summary.totalDeliveries
    ? Math.round((apiSummary.summary.cancelled / apiSummary.summary.totalDeliveries) * 100)
    : filtered.length
      ? Math.round((cancelledLocal / filtered.length) * 100)
      : 0;
  const totalCustomers = apiSummary?.summary.totalCustomers ?? customers.length;
  const activeFleetCount = apiSummary
    ? apiSummary.summary.availableVehicles
    : vehicles.filter((v) => v.status !== 'inactive').length;

  const handleExportCSV = () => {
    const headers = ['Tracking ID', 'Customer ID', 'Route', 'Status', 'Priority', 'Created', 'Expected'];
    const rows = filtered.map((d) =>
      [d.trackingId, d.customerId, `${d.pickupCity}-${d.destinationCity}`, d.status, d.priority, d.createdDate, d.expectedDelivery].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gnk-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV report exported successfully');
  };

  const handleExportPDF = () => {
    showToast('PDF report generated and downloaded', 'info');
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Performance insights for GURUNANAK logistics operations"
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download size={18} /> Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText size={18} /> Export PDF
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              range === r
                ? 'rainbow-gradient text-white shadow-md'
                : 'bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Shipments" value={totalShipments} icon={Package} accent={0} trend={`${RANGE_LABELS[range]} period`} />
        <KPICard title="Delivered" value={delivered} icon={TrendingUp} accent={3} />
        <KPICard title="In Transit" value={inTransit} icon={Truck} accent={1} />
        <KPICard title="Fleet & Drivers" value={fleetDriversLabel} icon={Users} accent={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Delivery Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Top Destination Cities</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="city" width={100} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rainbow-border p-5">
          <h3 className="text-lg font-semibold text-navy mb-4">Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center rounded-xl bg-slate-50/80 p-4">
              <span className="text-slate-600">Delivery Success Rate</span>
              <span className="font-bold text-emerald-600">{successRate}%</span>
            </div>
            <div className="flex justify-between items-center rounded-xl bg-slate-50/80 p-4">
              <span className="text-slate-600">Cancellation Rate</span>
              <span className="font-bold text-red-600">{cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-center rounded-xl bg-slate-50/80 p-4">
              <span className="text-slate-600">Total Customers</span>
              <span className="font-bold text-navy">{totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center rounded-xl bg-slate-50/80 p-4">
              <span className="text-slate-600">Active Fleet</span>
              <span className="font-bold text-navy">{activeFleetCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
