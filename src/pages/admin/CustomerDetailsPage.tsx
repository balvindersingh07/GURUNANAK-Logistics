import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Package } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, deliveries } = useApp();

  const customer = getCustomer(id || '');
  const customerDeliveries = deliveries
    .filter((d) => d.customerId === customer?.id)
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  const activeDeliveries = customerDeliveries.filter(
    (d) => !['delivered', 'cancelled'].includes(d.status),
  );
  const pastDeliveries = customerDeliveries.filter((d) =>
    ['delivered', 'cancelled'].includes(d.status),
  );

  if (!customer) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-navy">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate('/customers')}>Back to Customers</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description="Customer profile and delivery history"
        actions={
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft size={18} /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card rainbow-border p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 text-2xl font-bold mb-4">
            {customer.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-navy">{customer.name}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-slate-600"><Phone size={16} /> {customer.phone}</p>
            <p className="flex items-center gap-2 text-slate-600"><Mail size={16} /> {customer.email}</p>
            <p className="flex items-start gap-2 text-slate-600"><MapPin size={16} className="mt-0.5 shrink-0" /> {customer.address}</p>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard title="Total Deliveries" value={customer.totalDeliveries} icon={Package} accent={0} />
          <KPICard title="Active Orders" value={customer.activeOrders} icon={Package} accent={1} />
          <KPICard title="Last Delivery" value={customer.lastDelivery || '—'} icon={Package} accent={3} />
        </div>
      </div>

      {activeDeliveries.length > 0 && (
        <div className="glass-card rainbow-border overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-navy">Current Deliveries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Route</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Expected</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{d.trackingId}</td>
                    <td className="px-4 py-3">{d.pickupCity} → {d.destinationCity}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{d.expectedDelivery}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/deliveries/${d.id}`} className="text-violet-600 text-xs font-medium hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card rainbow-border overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-navy">Delivery History</h3>
        </div>
        {pastDeliveries.length === 0 && activeDeliveries.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">No deliveries on record</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Route</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Package</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(pastDeliveries.length > 0 ? pastDeliveries : customerDeliveries).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{d.trackingId}</td>
                    <td className="px-4 py-3">{d.pickupCity} → {d.destinationCity}</td>
                    <td className="px-4 py-3">{d.packageType}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{d.createdDate}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/deliveries/${d.id}`} className="text-violet-600 text-xs font-medium hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
