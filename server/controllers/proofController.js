import ProofOfDelivery from '../models/ProofOfDelivery.js';
import Delivery from '../models/Delivery.js';
import { isDbConnected } from '../config/db.js';
import {
  assertDeliveryAccess,
  buildDeliveryFilter,
  findDeliveryByIdOrTracking,
} from '../utils/deliveryAccess.js';

function buildPartialProofFields(body) {
  const setFields = {};

  if (body.photoUrl !== undefined && body.photoUrl !== null && body.photoUrl !== '') {
    setFields.photoUrl = body.photoUrl;
  }
  if (body.signature !== undefined && body.signature !== null && body.signature !== '') {
    setFields.signature = body.signature;
  }
  if (body.notes !== undefined && body.notes !== null && body.notes !== '') {
    setFields.notes = body.notes;
  }

  return setFields;
}

export async function listProofs(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = buildDeliveryFilter(req);
    const deliveryIds = await Delivery.find(filter).select('_id').lean();
    const ids = deliveryIds.map((d) => d._id);

    if (ids.length === 0) return res.json([]);

    const proofs = await ProofOfDelivery.find({ deliveryId: { $in: ids } });
    res.json(proofs);
  } catch (err) {
    next(err);
  }
}

export async function submitProof(req, res, next) {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database not configured' });

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const access = assertDeliveryAccess(req, delivery);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const setFields = buildPartialProofFields(req.body);
    const existing = await ProofOfDelivery.findOne({ deliveryId: delivery._id });

    if (Object.keys(setFields).length === 0) {
      if (!existing) return res.status(400).json({ error: 'No proof fields provided' });
      return res.json(existing);
    }

    const proof = await ProofOfDelivery.findOneAndUpdate(
      { deliveryId: delivery._id },
      {
        $set: setFields,
        $setOnInsert: {
          deliveryId: delivery._id,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const io = req.app.get('io');
    io?.emit('delivery:updated', delivery);

    res.status(existing ? 200 : 201).json(proof);
  } catch (err) {
    next(err);
  }
}

export async function getProof(req, res, next) {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database not configured' });

    const delivery = await Delivery.findById(req.params.id);
    const access = assertDeliveryAccess(req, delivery);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const proof = await ProofOfDelivery.findOne({ deliveryId: delivery._id });
    if (!proof) return res.status(404).json({ error: 'Proof not found' });
    res.json(proof);
  } catch (err) {
    next(err);
  }
}

export { findDeliveryByIdOrTracking };
