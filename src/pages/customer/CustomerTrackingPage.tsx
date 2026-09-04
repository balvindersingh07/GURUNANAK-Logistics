import { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Phone, Package, MapPin, User, Truck, Gauge, Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import DeliveryTimeline from '../../components/delivery/DeliveryTimeline';
import TrackingMap from '../../components/map/TrackingMap';
import EmptyState from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../hooks/useSocket';

export default function CustomerTrackingPage() {
  const { trackingId: routeTrackingId } = useParams<{ trackingId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { deliveries, getDriver, getVehicle } = useApp();
  const { showToast } = useToast();

  const queryTrackingId = searchParams.get('id') || searchParams.get('trackingId') || '';
  const resolvedId = routeTrackingId || queryTrackingId;

  const [searchInput, setSearchInput] = useState(resolvedId);

  useEffect(() => {
    setSearchInput(resolvedId);
  }, [resolvedId]);

  const delivery = useMemo(
    () =>
      resolvedId
        ? deliveries.find((d) => d.trackingId.toLowerCase() === resolvedId.toLowerCase())
        : undefined,
    [deliveries, resolvedId],
  );

  const driver = delivery ? getDriver(delivery.driverId || '') : undefined;
  const vehicle = delivery ? getVehicle(delivery.vehicleId || '') : undefined;

  const { subscribe } = useSocket();

  useEffect(() => {
    if (delivery) {
      subscribe(delivery.id);
      subscribe(delivery.trackingId);
    }
  }, [delivery?.id, delivery?.trackingId, subscribe]);

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) {
      showToast('Enter a tracking ID', 'error');
      return;
    }
    const found = deliveries.find((d) => d.trackingId.toLowerCase() === q.toLowerCase());
    if (!found) {
      showToast('Tracking ID not found', 'error');
      return;
    }
    navigate(`/customer/tracking/${found.trackingId}`);
  };

  const handleContactDriver = () => {
    if (driver) {
      showToast(`Connecting to ${driver.name} at ${driver.phone}`, 'info');
    } else {
      showToast('Driver not yet assigned to this delivery', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto lg:max-w-none">
      <PageHeader
        title="Track Delivery"
        description="Real-time shipment tracking on your mobile device"
      />

      <div className="glass-card rainbow-border p-4 mb-4">
        <div className="flex gap-2">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Enter tracking ID..."
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm" className="shrink-0 px-4">
            <Search size={18} />
          </Button>
        </div>
      </div>

      {!delivery ? (
        <EmptyState
          icon={Package}
          title={resolvedId ? 'Delivery not found' : 'Enter a tracking ID'}
          description={
            resolvedId
              ? `No delivery found for "${resolvedId}". Check the ID and try again.`
              : 'Search above or use a tracking link to view your shipment status.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="glass-card rainbow-border p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Tracking ID</p>
                <p className="font-mono text-lg font-bold text-navy">{delivery.trackingId}</p>
              </div>
              <StatusBadge status={delivery.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">From</p>
                <p className="font-medium text-navy">{delivery.pickupCity}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">To</p>
                <p className="font-medium text-navy">{delivery.destinationCity}</p>
              </div>
              {delivery.eta && delivery.status !== 'delivered' && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Estimated arrival</p>
                  <p className="font-medium text-violet-600">{delivery.eta}</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rainbow-border p-4 sm:p-5">
            <h3 className="text-base font-semibold text-navy mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-violet-600" />
              Delivery Timeline
            </h3>
            <DeliveryTimeline status={delivery.status} />
          </div>

          <div className="glass-card rainbow-border p-2 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-navy">Live Map</span>
            </div>
            <TrackingMap delivery={delivery} height="240px" />
          </div>

          {driver && (
            <div className="glass-card rainbow-border p-4 sm:p-5">
              <h3 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Driver Details
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full rainbow-gradient text-lg font-bold text-white shrink-0">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy">{driver.name}</p>
                  <p className="text-sm text-slate-500">{driver.phone}</p>
                  <p className="text-xs text-amber-600 mt-0.5">★ {driver.rating} rating</p>
                </div>
              </div>
              {vehicle && (
                <div className="mt-4 rounded-xl bg-slate-50/80 p-3 flex items-center gap-3 text-sm">
                  <Truck size={18} className="text-cyan-600 shrink-0" />
                  <div>
                    <p className="font-medium text-navy">{vehicle.vehicleNumber}</p>
                    <p className="text-slate-500">{vehicle.type} · {vehicle.registration}</p>
                  </div>
                  {delivery.speed != null && delivery.status !== 'delivered' && (
                    <div className="ml-auto flex items-center gap-1 text-slate-600">
                      <Gauge size={14} />
                      {Math.round(delivery.speed)} km/h
                    </div>
                  )}
                </div>
              )}
              <Button className="w-full mt-4" onClick={handleContactDriver}>
                <Phone size={18} />
                Contact Driver
              </Button>
            </div>
          )}

          <div className="glass-card rainbow-border p-4 text-sm space-y-2">
            <div>
              <p className="text-slate-500 text-xs">Pickup address</p>
              <p className="text-navy">{delivery.pickup}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Destination</p>
              <p className="text-navy">{delivery.destination}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
