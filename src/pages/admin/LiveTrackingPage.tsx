import { useState, useMemo, useEffect } from 'react';
import { MapPin, Truck, Gauge, User, Phone, Package } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import TrackingMap from '../../components/map/TrackingMap';
import { useApp } from '../../context/AppContext';
import { useSocket } from '../../hooks/useSocket';

export default function LiveTrackingPage() {
  const { deliveries, getCustomer, getDriver, getVehicle } = useApp();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          !['delivered', 'cancelled', 'pending'].includes(d.status) &&
          (search === '' ||
            d.trackingId.toLowerCase().includes(search.toLowerCase()) ||
            d.pickupCity.toLowerCase().includes(search.toLowerCase()) ||
            d.destinationCity.toLowerCase().includes(search.toLowerCase())),
      ),
    [deliveries, search],
  );

  const selected = activeDeliveries.find((d) => d.id === selectedId) || activeDeliveries[0] || null;
  const driver = selected ? getDriver(selected.driverId || '') : undefined;
  const vehicle = selected ? getVehicle(selected.vehicleId || '') : undefined;
  const customer = selected ? getCustomer(selected.customerId) : undefined;

  const { subscribe } = useSocket();

  useEffect(() => {
    if (selected) {
      subscribe(selected.id);
      subscribe(selected.trackingId);
    }
  }, [selected?.id, selected?.trackingId, subscribe]);

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        description="Real-time fleet monitoring across Rajasthan, Punjab & Delhi NCR"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Delivery List Panel */}
        <div className="xl:col-span-3 glass-card rainbow-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search active deliveries..."
            />
            <p className="mt-2 text-xs text-slate-500">{activeDeliveries.length} active shipments</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {activeDeliveries.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <Package className="mx-auto mb-2 text-slate-300" size={32} />
                No active deliveries to track
              </div>
            ) : (
              activeDeliveries.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50/80 transition-colors ${
                    selected?.id === d.id ? 'bg-violet-50/80 border-l-2 border-violet-500' : ''
                  }`}
                >
                  <p className="font-mono text-xs font-medium text-navy">{d.trackingId}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {d.pickupCity} → {d.destinationCity}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={d.status} />
                    <span className="text-xs text-slate-400">{d.eta || '—'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map Panel */}
        <div className="xl:col-span-6 glass-card rainbow-border p-2 flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <MapPin size={18} className="text-violet-600" />
            <span className="text-sm font-medium text-navy">
              {selected ? `${selected.pickupCity} → ${selected.destinationCity}` : 'Select a delivery'}
            </span>
          </div>
          <div className="flex-1 min-h-[300px]">
            <TrackingMap
              delivery={selected}
              deliveries={activeDeliveries}
              height="100%"
              onSelect={setSelectedId}
            />
          </div>
        </div>

        {/* Vehicle Details Panel */}
        <div className="xl:col-span-3 glass-card rainbow-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-navy flex items-center gap-2">
              <Truck size={18} className="text-cyan-600" />
              Vehicle Details
            </h3>
          </div>
          {selected ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Tracking ID</p>
                <p className="font-mono font-medium text-navy">{selected.trackingId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              {vehicle && (
                <div className="rounded-xl bg-slate-50/80 p-4 space-y-2">
                  <p className="font-medium text-navy">{vehicle.vehicleNumber}</p>
                  <p className="text-sm text-slate-600">{vehicle.type} — {vehicle.capacity}</p>
                  <p className="text-xs text-slate-500">Reg: {vehicle.registration}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge size={14} className="text-violet-600" />
                    <span>{Math.round(selected.speed || 0)} km/h</span>
                  </div>
                </div>
              )}
              {driver && (
                <div className="rounded-xl bg-slate-50/80 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <p className="font-medium text-navy">{driver.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} />
                    {driver.phone}
                  </div>
                  <p className="text-xs text-slate-500">Rating: {driver.rating} ★</p>
                </div>
              )}
              {customer && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                  <p className="text-sm font-medium text-navy">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Last updated: {selected.lastUpdated ? new Date(selected.lastUpdated).toLocaleString('en-IN') : '—'}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 text-center">
              Select an active delivery to view vehicle details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
