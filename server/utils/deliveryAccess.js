import Delivery from '../models/Delivery.js';

export function buildDeliveryFilter(req) {
  const filter = {};
  const { status, driverId, customerId, search } = req.query;

  if (status) filter.status = status;
  if (driverId) filter.driverId = driverId;
  if (customerId) filter.customerId = customerId;

  if (req.user.role === 'customer' && req.user.customerId) {
    filter.customerId = req.user.customerId;
  } else if (req.user.role === 'driver' && req.user.driverId) {
    filter.driverId = req.user.driverId;
  }

  if (search) {
    filter.$or = [
      { trackingId: { $regex: search, $options: 'i' } },
      { pickup: { $regex: search, $options: 'i' } },
      { destination: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
}

function refIdString(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

export function assertDeliveryAccess(req, delivery) {
  if (!delivery) return { ok: false, status: 404, error: 'Delivery not found' };

  if (req.user.role === 'customer' && req.user.customerId) {
    if (refIdString(delivery.customerId) !== String(req.user.customerId)) {
      return { ok: false, status: 403, error: 'Forbidden' };
    }
  }

  if (req.user.role === 'driver' && req.user.driverId) {
    if (refIdString(delivery.driverId) !== String(req.user.driverId)) {
      return { ok: false, status: 403, error: 'Forbidden' };
    }
  }

  return { ok: true };
}

/** Resolve delivery by MongoDB id or trackingId string */
export async function findDeliveryByIdOrTracking(id) {
  if (!id) return null;

  const byId = await Delivery.findById(id);
  if (byId) return byId;

  return Delivery.findOne({ trackingId: String(id) });
}
