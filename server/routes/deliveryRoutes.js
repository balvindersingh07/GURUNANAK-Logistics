import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController.js';
import * as proofController from '../controllers/proofController.js';
import { auth } from '../middleware/auth.js';
import { enrichUser } from '../middleware/enrichUser.js';
import { roleCheck } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { deliverySchema, deliveryStatusSchema } from '../validators/schemas.js';

const router = Router();

router.use(auth, enrichUser);

router.get('/proofs', proofController.listProofs);
router.get('/', deliveryController.getDeliveries);
router.get('/:id', deliveryController.getDeliveryById);
router.post(
  '/',
  roleCheck('admin', 'dispatcher'),
  validate(deliverySchema),
  deliveryController.createDelivery,
);
router.put(
  '/:id',
  roleCheck('admin', 'dispatcher'),
  validate(deliverySchema.partial()),
  deliveryController.updateDelivery,
);
router.patch(
  '/:id/status',
  roleCheck('admin', 'dispatcher', 'driver'),
  validate(deliveryStatusSchema),
  deliveryController.patchStatus,
);
router.post(
  '/:id/proof',
  roleCheck('admin', 'dispatcher', 'driver'),
  proofController.submitProof,
);
router.get('/:id/proof', proofController.getProof);
router.delete('/:id', roleCheck('admin', 'dispatcher'), deliveryController.deleteDelivery);

export default router;
