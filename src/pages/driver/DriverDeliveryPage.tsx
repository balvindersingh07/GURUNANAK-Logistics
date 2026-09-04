import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Phone,
  Navigation,
  Package,
  MapPin,
  User,
  Upload,
  CheckCircle,
  Camera,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import SignatureCapture from '../../components/ui/SignatureCapture';
import StatusBadge from '../../components/ui/StatusBadge';
import DeliveryTimeline from '../../components/delivery/DeliveryTimeline';
import TrackingMap from '../../components/map/TrackingMap';
import EmptyState from '../../components/ui/EmptyState';
import { FormField, inputClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../hooks/useSocket';
import { deliveryService } from '../../services/deliveryService';
import type { DeliveryStatus, Delivery, User as AppUser } from '../../types';
import { STATUS_LABELS } from '../../types';
import { getNextStatuses } from '../../utils/deliveryTransitions';
import { hasRequiredProof } from '../../utils/proofRequirements';

function resolveRouteDelivery(
  deliveries: Delivery[],
  routeId: string | undefined,
  driverId: string | undefined,
): Delivery | undefined {
  if (!driverId) return undefined;

  const isAssignedToDriver = (d: Delivery) =>
    Boolean(d.driverId && driverId && String(d.driverId) === String(driverId));
  const matchesRoute = (d: Delivery) =>
    d.id === routeId ||
    Boolean(routeId && d.trackingId.toLowerCase() === routeId.toLowerCase());

  if (routeId) {
    return deliveries.find((d) => matchesRoute(d) && isAssignedToDriver(d));
  }

  return undefined;
}

function resolveDefaultDelivery(
  deliveries: Delivery[],
  driver: { id: string; currentDeliveryId?: string } | undefined,
): Delivery | undefined {
  if (!driver) return undefined;

  const isAssignedToDriver = (d: Delivery) =>
    Boolean(d.driverId && driver.id && String(d.driverId) === String(driver.id));

  if (driver.currentDeliveryId) {
    const current = deliveries.find((d) => d.id === driver.currentDeliveryId);
    if (current && isAssignedToDriver(current)) return current;
  }

  return deliveries.find(
    (d) => isAssignedToDriver(d) && !['delivered', 'cancelled'].includes(d.status),
  );
}

export default function DriverDeliveryPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const { deliveries, drivers, updateDeliveryStatus, getCustomer, saveProofOfDelivery, getProofOfDelivery } = useApp();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoSaved, setPhotoSaved] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [routeDelivery, setRouteDelivery] = useState<Delivery | undefined>();
  const [routeLoading, setRouteLoading] = useState(false);
  const { subscribe } = useSocket();

  const driver = useMemo(
    () => drivers.find((d) => d.email.toLowerCase() === user?.email.toLowerCase()),
    [drivers, user],
  );

  const linkedDriverId =
    (user as AppUser & { driverId?: string })?.driverId ?? driver?.id;

  useEffect(() => {
    if (!routeId || !linkedDriverId) {
      setRouteDelivery(undefined);
      setRouteLoading(false);
      return;
    }

    const cached = resolveRouteDelivery(deliveries, routeId, linkedDriverId);
    if (cached) {
      setRouteDelivery(cached);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    deliveryService
      .getById(routeId)
      .then((d) => {
        if (cancelled) return;
        if (String(d.driverId) === String(linkedDriverId)) {
          setRouteDelivery(d);
        } else {
          setRouteDelivery(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setRouteDelivery(undefined);
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeId, linkedDriverId, deliveries]);

  const delivery = useMemo(() => {
    if (routeId) {
      return routeDelivery ?? resolveRouteDelivery(deliveries, routeId, linkedDriverId);
    }
    return resolveDefaultDelivery(deliveries, driver);
  }, [routeId, routeDelivery, linkedDriverId, driver, deliveries]);

  const customer = delivery ? getCustomer(delivery.customerId) : undefined;
  const proof = delivery ? getProofOfDelivery(delivery.id) : undefined;
  const proofComplete = hasRequiredProof(proof);

  useEffect(() => {
    if (!delivery) return;
    const existing = getProofOfDelivery(delivery.id);
    setPhotoSaved(!!existing?.photoUrl);
    setSignatureSaved(!!existing?.signature);
    setNotes(existing?.notes ?? '');
    subscribe(delivery.id);
    subscribe(delivery.trackingId);
  }, [delivery, getProofOfDelivery, subscribe]);

  const nextStatuses = delivery ? getNextStatuses(delivery.status) : [];

  const handleNavigate = () => {
    if (!delivery) return;
    showToast(
      `Opening navigation to ${delivery.destination}, ${delivery.destinationCity}`,
      'info',
    );
  };

  const handleCallCustomer = () => {
    if (customer) {
      showToast(`Calling ${customer.name} at ${customer.phone}`, 'info');
    } else {
      showToast('Customer contact not available', 'error');
    }
  };

  const handleStatusUpdate = async (status: DeliveryStatus, label: string) => {
    if (!delivery) return;
    if (status === 'delivered' && !proofComplete) {
      showToast('Please upload photo and save signature before marking delivered', 'error');
      return;
    }
    try {
      await updateDeliveryStatus(delivery.id, status);
      showToast(`${label} — ${STATUS_LABELS[status]}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  const handleProofUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !delivery) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const photoUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await saveProofOfDelivery(delivery.id, {
        photoUrl,
        notes: notes.trim() || `Uploaded: ${file.name}`,
      });
      setPhotoSaved(true);
      showToast(`Proof photo "${file.name}" uploaded successfully`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSignatureSave = async (signature: string) => {
    if (!delivery) return;
    try {
      await saveProofOfDelivery(delivery.id, {
        signature,
        notes: notes.trim() || undefined,
      });
      setSignatureSaved(true);
      showToast('Signature saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save signature', 'error');
    }
  };

  const handleNotesBlur = async () => {
    if (!delivery || !notes.trim()) return;
    const existing = getProofOfDelivery(delivery.id);
    if (existing?.notes === notes.trim()) return;
    try {
      await saveProofOfDelivery(delivery.id, { notes: notes.trim() });
    } catch {
      // Notes are optional; avoid blocking the driver workflow
    }
  };

  if (!delivery) {
    if (routeId && routeLoading) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      );
    }

    const routeRequested = Boolean(routeId);
    return (
      <div>
        <PageHeader
          title={routeRequested ? 'Delivery Not Found' : 'Current Delivery'}
          description={
            routeRequested
              ? 'The requested delivery could not be loaded'
              : 'Manage your active shipment'
          }
        />
        <EmptyState
          icon={Package}
          title={routeRequested ? 'Delivery not found' : 'No delivery assigned'}
          description={
            routeRequested
              ? 'This delivery does not exist or you do not have access to it.'
              : 'Return to the dashboard when a new delivery is assigned to you.'
          }
          action={
            <Button onClick={() => navigate('/driver/dashboard')}>Go to Dashboard</Button>
          }
        />
      </div>
    );
  }

  const isDelivered = delivery.status === 'delivered';
  const showProofSection = delivery.status === 'out_for_delivery' || isDelivered;

  return (
    <div className="max-w-lg mx-auto lg:max-w-none pb-4">
      <PageHeader
        title={delivery.trackingId}
        description={`${delivery.pickupCity} → ${delivery.destinationCity}`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Button className="flex-1 min-w-[140px]" onClick={handleNavigate}>
          <Navigation size={18} />
          Navigate
        </Button>
        <Button variant="outline" className="flex-1 min-w-[140px]" onClick={handleCallCustomer}>
          <Phone size={18} />
          Call Customer
        </Button>
      </div>

      <div className="glass-card rainbow-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-navy">Status</h3>
          <StatusBadge status={delivery.status} />
        </div>
        <DeliveryTimeline status={delivery.status} />
      </div>

      <div className="glass-card rainbow-border p-4 mb-4">
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-violet-600" />
          Route Map
        </h3>
        <TrackingMap delivery={delivery} height="220px" />
      </div>

      <div className="glass-card rainbow-border p-4 mb-4 space-y-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 uppercase">Pickup</p>
          <p className="font-medium text-navy">{delivery.pickup}</p>
          <p className="text-slate-500">{delivery.pickupCity}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase">Drop-off</p>
          <p className="font-medium text-navy">{delivery.destination}</p>
          <p className="text-slate-500">{delivery.destinationCity}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Package</p>
            <p className="text-navy">{delivery.packageType}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Weight</p>
            <p className="text-navy">{delivery.weight}</p>
          </div>
        </div>
      </div>

      {customer && (
        <div className="glass-card rainbow-border p-4 mb-4">
          <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            Customer
          </h3>
          <p className="font-medium text-navy">{customer.name}</p>
          <p className="text-sm text-slate-500">{customer.phone}</p>
          <p className="text-xs text-slate-400 mt-1">{customer.address}</p>
        </div>
      )}

      <div className="glass-card rainbow-border p-4 mb-4">
        <h3 className="font-semibold text-navy mb-3">Update Status</h3>
        <div className="grid grid-cols-1 gap-2">
          {nextStatuses.map((status) => {
            const needsProof = status === 'delivered' && !proofComplete;
            return (
              <Button
                key={status}
                variant="primary"
                size="sm"
                className="w-full justify-start"
                disabled={isDelivered}
                onClick={() => {
                  if (needsProof) {
                    showToast('Complete proof of delivery (photo + signature) first', 'error');
                    return;
                  }
                  handleStatusUpdate(status, STATUS_LABELS[status]);
                }}
              >
                <Package size={16} />
                {STATUS_LABELS[status]}
              </Button>
            );
          })}
          {nextStatuses.length === 0 && !isDelivered && (
            <p className="text-sm text-slate-500">No further status updates available.</p>
          )}
        </div>
      </div>

      {showProofSection && (
        <div className="glass-card rainbow-border p-4">
          <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
            <Camera size={18} className="text-emerald-600" />
            Proof of Delivery
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Step 1 — Photo</p>
              {photoSaved ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <CheckCircle className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <p className="font-medium text-emerald-800">Photo saved</p>
                    <p className="text-xs text-emerald-600">Delivery photo on file</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleProofUpload}
                  loading={uploading}
                  disabled={isDelivered}
                >
                  <Upload size={18} />
                  Upload Photo
                </Button>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Step 2 — Signature</p>
              {signatureSaved ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <CheckCircle className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <p className="font-medium text-emerald-800">Signature saved</p>
                    <p className="text-xs text-emerald-600">Recipient signature on file</p>
                  </div>
                </div>
              ) : (
                <SignatureCapture onSave={handleSignatureSave} />
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Step 3 — Notes (optional)</p>
              <FormField label="Delivery notes">
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Gate code, handoff details, etc."
                  disabled={isDelivered}
                />
              </FormField>
            </div>
          </div>

          {!isDelivered && (
            <p className="text-xs text-slate-500 mt-3">
              Upload a photo and save a signature before marking as delivered.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
