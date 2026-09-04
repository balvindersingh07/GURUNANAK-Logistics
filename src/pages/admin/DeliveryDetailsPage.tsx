import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Download,
  RefreshCw,
  Package,
  User,
  Truck,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import DeliveryTimeline from '../../components/delivery/DeliveryTimeline';
import TrackingMap from '../../components/map/TrackingMap';
import { FormField, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { DeliveryStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { getNextStatuses } from '../../utils/deliveryTransitions';

export default function DeliveryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getDelivery, getCustomer, getDriver, getVehicle, updateDeliveryStatus } = useApp();

  const delivery = getDelivery(id || '');
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('pending');

  if (!delivery) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-navy">Delivery not found</h2>
        <Button className="mt-4" onClick={() => navigate('/deliveries')}>Back to Deliveries</Button>
      </div>
    );
  }

  const customer = getCustomer(delivery.customerId);
  const driver = getDriver(delivery.driverId || '');
  const vehicle = getVehicle(delivery.vehicleId || '');

  const handleStatusUpdate = async () => {
    try {
      await updateDeliveryStatus(delivery.id, newStatus);
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`);
      setStatusOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid status transition', 'error');
    }
  };

  const handleContactDriver = () => {
    if (driver) {
      showToast(`Calling ${driver.name} at ${driver.phone}`, 'info');
    } else {
      showToast('No driver assigned to this delivery', 'error');
    }
  };

  const handleDownloadReceipt = () => {
    showToast(`Receipt for ${delivery.trackingId} downloaded`, 'success');
  };

  return (
    <div>
      <PageHeader
        title={delivery.trackingId}
        description={`${delivery.pickupCity} → ${delivery.destinationCity}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/deliveries')}>
            <ArrowLeft size={18} /> Back
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={() => { setNewStatus(delivery.status); setStatusOpen(true); }}>
          <RefreshCw size={18} /> Update Status
        </Button>
        <Button variant="outline" onClick={handleContactDriver}>
          <Phone size={18} /> Contact Driver
        </Button>
        <Button variant="outline" onClick={() => navigate('/tracking')}>
          <MapPin size={18} /> View Route
        </Button>
        <Button variant="outline" onClick={handleDownloadReceipt}>
          <Download size={18} /> Download Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rainbow-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy">Delivery Status</h3>
              <StatusBadge status={delivery.status} />
            </div>
            <DeliveryTimeline status={delivery.status} />
          </div>

          <div className="glass-card rainbow-border p-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Live Map</h3>
            <TrackingMap delivery={delivery} height="320px" />
          </div>

          <div className="glass-card rainbow-border p-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Shipment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Pickup</p>
                <p className="font-medium text-navy">{delivery.pickup}</p>
                <p className="text-slate-500">{delivery.pickupCity}</p>
              </div>
              <div>
                <p className="text-slate-500">Destination</p>
                <p className="font-medium text-navy">{delivery.destination}</p>
                <p className="text-slate-500">{delivery.destinationCity}</p>
              </div>
              <div>
                <p className="text-slate-500">Package Type</p>
                <p className="font-medium text-navy">{delivery.packageType}</p>
              </div>
              <div>
                <p className="text-slate-500">Weight</p>
                <p className="font-medium text-navy">{delivery.weight}</p>
              </div>
              <div>
                <p className="text-slate-500">Priority</p>
                <p className="font-medium text-navy capitalize">{delivery.priority}</p>
              </div>
              <div>
                <p className="text-slate-500">Created</p>
                <p className="font-medium text-navy">{delivery.createdDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rainbow-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-violet-600" size={20} />
              <h3 className="text-lg font-semibold text-navy">Timing</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Delivery</span>
                <span className="font-medium">{delivery.expectedDelivery}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ETA</span>
                <span className="font-medium text-violet-600">{delivery.eta || '—'}</span>
              </div>
              {delivery.speed !== undefined && delivery.status !== 'delivered' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Speed</span>
                  <span className="font-medium">{Math.round(delivery.speed)} km/h</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rainbow-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-navy">Customer</h3>
            </div>
            {customer ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-navy">{customer.name}</p>
                <p className="text-slate-500">{customer.phone}</p>
                <p className="text-slate-500">{customer.email}</p>
                <Link to={`/customers/${customer.id}`} className="text-violet-600 text-xs font-medium hover:underline">
                  View customer profile →
                </Link>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No customer data</p>
            )}
          </div>

          <div className="glass-card rainbow-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="text-cyan-600" size={20} />
              <h3 className="text-lg font-semibold text-navy">Assignment</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Driver</p>
                {driver ? (
                  <>
                    <p className="font-medium text-navy">{driver.name}</p>
                    <p className="text-slate-500">{driver.phone}</p>
                    <Link to={`/drivers/${driver.id}`} className="text-violet-600 text-xs font-medium hover:underline">
                      View driver profile →
                    </Link>
                  </>
                ) : (
                  <p className="text-slate-400">Unassigned</p>
                )}
              </div>
              <div>
                <p className="text-slate-500">Vehicle</p>
                {vehicle ? (
                  <p className="font-medium text-navy">{vehicle.vehicleNumber} — {vehicle.type}</p>
                ) : (
                  <p className="text-slate-400">Unassigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Update Status" footer={
        <ModalFooter onCancel={() => setStatusOpen(false)} onConfirm={handleStatusUpdate} confirmLabel="Update" />
      }>
        <FormField label="New Status">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)} className={selectClass}>
            {[delivery.status, ...getNextStatuses(delivery.status)].map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </FormField>
      </Modal>
    </div>
  );
}
