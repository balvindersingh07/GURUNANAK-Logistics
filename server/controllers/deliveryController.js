import Delivery from '../models/Delivery.js';
import Notification from '../models/Notification.js';
import ProofOfDelivery from '../models/ProofOfDelivery.js';
import { isDbConnected } from '../config/db.js';
import { validateTransition } from '../utils/deliveryTransitions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { assertDeliveryAccess, buildDeliveryFilter } from '../utils/deliveryAccess.js';
import { hasRequiredProof } from '../utils/proofRequirements.js';

function generateTrackingId() {
  return `GNK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0')}`;
}

function getIo(req) {
  return req.app.get('io');
}

async function createNotification(data) {
  return Notification.create(data);
}

export async function getDeliveries(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = buildDeliveryFilter(req);
    const { page, limit, skip } = parsePagination(req.query);

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate('customerId', 'name email phone')
        .populate('driverId', 'name phone')
        .populate('vehicleId', 'vehicleNumber type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(filter),
    ]);

    res.json(paginatedResponse(deliveries, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getDeliveryById(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const delivery = await Delivery.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate('driverId', 'name phone email')
      .populate('vehicleId', 'vehicleNumber type registration');

    const access = assertDeliveryAccess(req, delivery);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    res.json(delivery);
  } catch (err) {
    next(err);
  }
}

export async function createDelivery(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const data = {
      ...req.body,
      trackingId: req.body.trackingId || generateTrackingId(),
      lastUpdated: new Date().toISOString(),
    };

    const delivery = await Delivery.create(data);
    const populated = await Delivery.findById(delivery._id)
      .populate('customerId', 'name email')
      .populate('driverId', 'name')
      .populate('vehicleId', 'vehicleNumber');

    const io = getIo(req);
    io?.emit('delivery:created', populated);

    const notification = await createNotification({
      type: 'delivery_update',
      title: 'New Delivery Created',
      message: `Delivery ${delivery.trackingId} has been created`,
      link: `/deliveries/${delivery._id}`,
      deliveryId: delivery._id,
    });
    io?.emit('notification:new', notification);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

export async function updateDelivery(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const existing = await Delivery.findById(req.params.id);
    const access = assertDeliveryAccess(req, existing);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    if (req.body.status && req.body.status !== existing.status) {
      const transitionError = validateTransition(existing.status, req.body.status);
      if (transitionError) {
        return res.status(400).json({ error: transitionError });
      }
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date().toISOString() },
      { new: true, runValidators: true },
    )
      .populate('customerId', 'name email')
      .populate('driverId', 'name')
      .populate('vehicleId', 'vehicleNumber');

    const io = getIo(req);
    io?.emit('delivery:updated', delivery);

    res.json(delivery);
  } catch (err) {
    next(err);
  }
}

export async function patchStatus(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { status } = req.body;
    const existing = await Delivery.findById(req.params.id);

    const access = assertDeliveryAccess(req, existing);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const transitionError = validateTransition(existing.status, status);
    if (transitionError) {
      return res.status(400).json({ error: transitionError });
    }

    if (status === 'delivered' && req.user.role === 'driver') {
      const proof = await ProofOfDelivery.findOne({ deliveryId: existing._id });
      if (!hasRequiredProof(proof)) {
        return res.status(400).json({
          error:
            'Proof of delivery (photo and signature) is required before marking as delivered',
        });
      }
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status, lastUpdated: new Date().toISOString() },
      { new: true, runValidators: true },
    )
      .populate('customerId', 'name email')
      .populate('driverId', 'name')
      .populate('vehicleId', 'vehicleNumber');

    const io = getIo(req);
    io?.emit('delivery:statusChanged', {
      id: delivery._id.toString(),
      status,
      delivery,
    });
    io?.to(`delivery:${delivery._id}`).emit('delivery:updated', delivery);
    io?.to(`track:${delivery.trackingId}`).emit('delivery:updated', delivery);

    const notification = await createNotification({
      type: 'delivery_update',
      title: 'Delivery Status Updated',
      message: `Delivery ${delivery.trackingId} is now ${status}`,
      link: `/deliveries/${delivery._id}`,
      deliveryId: delivery._id,
    });
    io?.emit('notification:new', notification);

    res.json(delivery);
  } catch (err) {
    next(err);
  }
}

export async function deleteDelivery(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ message: 'Delivery deleted', id: delivery._id });
  } catch (err) {
    next(err);
  }
}
