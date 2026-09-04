/**
 * GPS Adapter Interface
 * ---------------------
 * Current implementation: trackingSimulator.js (simulated coordinates)
 * Future: replace with real GPS/telematics provider implementing updateLocation()
 */

export const GPS_SOURCE = 'simulator';

export function createGpsAdapter(_io) {
  return {
    source: GPS_SOURCE,
    /** @param {import('mongoose').Document} delivery */
    async updateLocation(delivery) {
      const lat =
        (delivery.currentLat ?? delivery.pickupLat) +
        (delivery.destLat - (delivery.currentLat ?? delivery.pickupLat)) * 0.05;
      const lng =
        (delivery.currentLng ?? delivery.pickupLng) +
        (delivery.destLng - (delivery.currentLng ?? delivery.pickupLng)) * 0.05;
      return { lat, lng, speed: 55 + Math.random() * 20 };
    },
  };
}
