import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { customerSchema } from '../validators/schemas.js';

const router = Router();

router.use(auth);

router.get('/', roleCheck('admin', 'dispatcher'), customerController.getCustomers);
router.get('/:id', roleCheck('admin', 'dispatcher'), customerController.getCustomerById);
router.post('/', roleCheck('admin'), validate(customerSchema), customerController.createCustomer);
router.put(
  '/:id',
  roleCheck('admin'),
  validate(customerSchema.partial()),
  customerController.updateCustomer,
);
router.delete('/:id', roleCheck('admin'), customerController.deleteCustomer);

export default router;
