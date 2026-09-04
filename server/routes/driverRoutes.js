import { Router } from 'express';
import * as driverController from '../controllers/driverController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { driverSchema } from '../validators/schemas.js';

const router = Router();

router.use(auth);

router.get('/', roleCheck('admin', 'dispatcher'), driverController.getDrivers);
router.get('/:id', roleCheck('admin', 'dispatcher'), driverController.getDriverById);
router.post('/', roleCheck('admin'), validate(driverSchema), driverController.createDriver);
router.put(
  '/:id',
  roleCheck('admin'),
  validate(driverSchema.partial()),
  driverController.updateDriver,
);
router.delete('/:id', roleCheck('admin'), driverController.deleteDriver);

export default router;
