import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { Delivery } from '../../types';

const truckIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#8B5CF6,#3B82F6);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0M9 18.5a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0M20 8h-3V4H3v13h1.5M20 8v8h-2.5M20 8h-5v5h7.5"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pickupIcon = new L.DivIcon({
  html: `<div style="background:#22C55E;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = new L.DivIcon({
  html: `<div style="background:#EF4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface TrackingMapProps {
  delivery?: Delivery | null;
  deliveries?: Delivery[];
  height?: string;
  onSelect?: (id: string) => void;
}

export default function TrackingMap({
  delivery,
  deliveries = [],
  height = '100%',
  onSelect,
}: TrackingMapProps) {
  const active = delivery || deliveries[0];
  const center: [number, number] = active
    ? [active.currentLat || active.pickupLat, active.currentLng || active.pickupLng]
    : [28.6139, 77.209];

  const routePoints: [number, number][] = active
    ? [
        [active.pickupLat, active.pickupLng],
        [active.currentLat || active.pickupLat, active.currentLng || active.pickupLng],
        [active.destLat, active.destLng],
      ]
    : [];

  return (
    <div style={{ height }} className="relative rounded-[18px] overflow-hidden">
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {active && (
          <>
            <Marker position={[active.pickupLat, active.pickupLng]} icon={pickupIcon}>
              <Popup>Pickup: {active.pickupCity}</Popup>
            </Marker>
            <Marker
              position={[active.currentLat || active.pickupLat, active.currentLng || active.pickupLng]}
              icon={truckIcon}
            >
              <Popup>In Transit — {active.trackingId}</Popup>
            </Marker>
            <Marker position={[active.destLat, active.destLng]} icon={destIcon}>
              <Popup>Destination: {active.destinationCity}</Popup>
            </Marker>
            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                pathOptions={{ color: '#8B5CF6', weight: 4, opacity: 0.7, dashArray: '10 10' }}
              />
            )}
          </>
        )}
        {!active &&
          deliveries.slice(0, 5).map((d) => (
            <Marker
              key={d.id}
              position={[d.currentLat || d.pickupLat, d.currentLng || d.pickupLng]}
              icon={truckIcon}
              eventHandlers={{ click: () => onSelect?.(d.id) }}
            >
              <Popup>{d.trackingId}</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
