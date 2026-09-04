import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Wrench, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export default function FleetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVehicle, getDriver, deliveries } = useApp();
  const vehicle = id ? getVehicle(id) : undefined;
  const driver = vehicle?.driverId ? getDriver(vehicle.driverId) : undefined;
  const activeDelivery = deliveries.find(
    (d) => d.vehicleId === id && !['delivered', 'cancelled'].includes(d.status),
  );

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Vehicle not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/fleet')}>
          Back to Fleet
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/fleet')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy mb-4"
      >
        <ArrowLeft size={16} /> Back to Fleet
      </button>

      <PageHeader
        title={vehicle.vehicleNumber}
        description={vehicle.registration}
        actions={<StatusBadge status={vehicle.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <h3 className="font-semibold text-navy flex items-center gap-2">
            <Truck size={18} /> Vehicle Information
          </h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Type</dt><dd className="font-medium">{vehicle.type}</dd></div>
            <div><dt className="text-slate-500">Capacity</dt><dd className="font-medium">{vehicle.capacity}</dd></div>
            <div><dt className="text-slate-500">Mileage</dt><dd className="font-medium">{vehicle.mileage.toLocaleString()} km</dd></div>
            <div><dt className="text-slate-500">Registration</dt><dd className="font-medium">{vehicle.registration}</dd></div>
          </dl>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-navy flex items-center gap-2">
            <Wrench size={18} /> Maintenance
          </h3>
          <div className="text-sm space-y-2">
            <p><span className="text-slate-500">Insurance Expiry:</span> {vehicle.insuranceExpiry}</p>
            <p><span className="text-slate-500">Last Service:</span> {vehicle.lastService}</p>
            <p><span className="text-slate-500">Next Service:</span> {vehicle.nextService}</p>
          </div>
        </div>

        {driver && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-navy mb-3">Assigned Driver</h3>
            <p className="font-medium">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.phone}</p>
            <Link to={`/drivers/${driver.id}`} className="text-sm text-violet-600 mt-2 inline-block">
              View Profile →
            </Link>
          </div>
        )}

        {activeDelivery && (
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="font-semibold text-navy flex items-center gap-2 mb-3">
              <Calendar size={18} /> Active Delivery
            </h3>
            <p className="text-sm">
              {activeDelivery.trackingId} — {activeDelivery.pickupCity} → {activeDelivery.destinationCity}
            </p>
            <StatusBadge status={activeDelivery.status} />
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(`/deliveries/${activeDelivery.id}`)}>
              View Delivery
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
