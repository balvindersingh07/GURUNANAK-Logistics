import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { vehicleSchema } from '../validators/schemas.js';

const router = Router();

router.use(auth);

router.get('/', roleCheck('admin', 'dispatcher'), vehicleController.getVehicles);
router.get('/:id', roleCheck('admin', 'dispatcher'), vehicleController.getVehicleById);
router.post('/', roleCheck('admin'), validate(vehicleSchema), vehicleController.createVehicle);
router.put(
  '/:id',
  roleCheck('admin'),
  validate(vehicleSchema.partial()),
  vehicleController.updateVehicle,
);
router.delete('/:id', roleCheck('admin'), vehicleController.deleteVehicle);

export default router;
