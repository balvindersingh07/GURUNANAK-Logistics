import Delivery from '../models/Delivery.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { isDbConnected } from '../config/db.js';
import { createGpsAdapter } from './gpsAdapter.js';

const ACTIVE_STATUSES = ['in_transit', 'out_for_delivery', 'picked_up'];
const INTERVAL_MS = 30000;

let intervalId = null;

/**
 * Simulates GPS movement for active deliveries, drivers, and vehicles.
 * Uses gpsAdapter abstraction — replace adapter for real telematics when available.
 */
export function startTrackingSimulator(io) {
  if (!isDbConnected() || intervalId) return;

  const gpsAdapter = createGpsAdapter(io);

  intervalId = setInterval(async () => {
    try {
      const activeDeliveries = await Delivery.find({ status: { $in: ACTIVE_STATUSES } });

      for (const delivery of activeDeliveries) {
        const { lat, lng, speed } = await gpsAdapter.updateLocation(delivery);

        delivery.currentLat = lat;
        delivery.currentLng = lng;
        delivery.speed = speed;
        delivery.lastUpdated = new Date().toISOString();
        await delivery.save();

        io.to(`delivery:${delivery._id}`).emit('delivery:updated', delivery);
        io.to(`track:${delivery.trackingId}`).emit('delivery:updated', delivery);

        if (delivery.driverId) {
          await Driver.findByIdAndUpdate(delivery.driverId, {
            currentLat: lat,
            currentLng: lng,
            lastLocationUpdate: new Date(),
          });

          io.emit('driver:locationUpdated', {
            id: delivery.driverId.toString(),
            driverId: delivery.driverId.toString(),
            deliveryId: delivery._id.toString(),
            lat,
            lng,
            speed,
          });
        }

        if (delivery.vehicleId) {
          await Vehicle.findByIdAndUpdate(delivery.vehicleId, {
            currentLat: lat,
            currentLng: lng,
            lastLocationUpdate: new Date(),
          });

          io.emit('vehicle:locationUpdated', {
            id: delivery.vehicleId.toString(),
            vehicleId: delivery.vehicleId.toString(),
            deliveryId: delivery._id.toString(),
            lat,
            lng,
            speed,
          });
        }
      }
    } catch (err) {
      console.error('Tracking simulator error:', err.message);
    }
  }, INTERVAL_MS);

  console.log(
    `Tracking simulator started via ${gpsAdapter.source} (interval: ${INTERVAL_MS / 1000}s)`,
  );
}

export function stopTrackingSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
