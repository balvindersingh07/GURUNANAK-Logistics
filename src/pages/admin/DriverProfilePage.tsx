import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Mail, MapPin, Truck, Package, Award } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';

export default function DriverProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDriver, getVehicle, deliveries, getCustomer } = useApp();

  const driver = getDriver(id || '');
  const vehicle = driver ? getVehicle(driver.vehicleId || '') : undefined;
  const driverDeliveries = deliveries
    .filter((d) => d.driverId === driver?.id)
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

  if (!driver) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-navy">Driver not found</h2>
        <Button className="mt-4" onClick={() => navigate('/drivers')}>Back to Drivers</Button>
      </div>
    );
  }

  const successRate = driver.totalDeliveries
    ? Math.round((driver.completedDeliveries / driver.totalDeliveries) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={driver.name}
        description="Driver profile and delivery history"
        actions={
          <Button variant="outline" onClick={() => navigate('/drivers')}>
            <ArrowLeft size={18} /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rainbow-border p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full rainbow-gradient text-2xl font-bold text-white mb-4">
            {driver.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-navy">{driver.name}</h2>
          <div className="mt-2 flex items-center justify-center gap-1 text-amber-600">
            <Star size={18} fill="currentColor" />
            <span className="font-semibold">{driver.rating}</span>
            <span className="text-slate-500 text-sm">/ 5.0</span>
          </div>
          <div className="mt-3"><StatusBadge status={driver.status} /></div>
          <div className="mt-6 space-y-3 text-sm text-left">
            <p className="flex items-center gap-2 text-slate-600"><Phone size={16} /> {driver.phone}</p>
            <p className="flex items-center gap-2 text-slate-600"><Mail size={16} /> {driver.email}</p>
            <p className="flex items-center gap-2 text-slate-600"><MapPin size={16} /> {driver.address}</p>
            <p className="text-slate-500">License: {driver.licenseNumber}</p>
            <p className="text-slate-500">Expires: {driver.licenseExpiry}</p>
          </div>
          {vehicle && (
            <div className="mt-4 rounded-xl bg-slate-50/80 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-navy">
                <Truck size={16} /> {vehicle.vehicleNumber}
              </p>
              <p className="text-slate-500 mt-1">{vehicle.type} — {vehicle.capacity}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard title="Total Deliveries" value={driver.totalDeliveries} icon={Package} accent={0} />
            <KPICard title="Completed" value={driver.completedDeliveries} icon={Award} accent={3} />
            <KPICard title="Cancelled" value={driver.cancelledDeliveries} icon={Package} accent={4} />
            <KPICard title="Success Rate" value={`${successRate}%`} icon={Star} accent={1} />
          </div>

          <div className="glass-card rainbow-border overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-navy">Delivery History</h3>
            </div>
            {driverDeliveries.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">No deliveries assigned yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Route</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs">{d.trackingId}</td>
                        <td className="px-4 py-3">{getCustomer(d.customerId)?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{d.pickupCity} → {d.destinationCity}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/deliveries/${d.id}`} className="text-violet-600 text-xs font-medium hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
