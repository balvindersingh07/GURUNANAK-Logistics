import { Router } from 'express';
import * as routeController from '../controllers/routeController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { routeSchema } from '../validators/schemas.js';

const router = Router();

router.use(auth);

router.get('/', routeController.getRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', roleCheck('admin', 'dispatcher'), validate(routeSchema), routeController.createRoute);
router.put(
  '/:id',
  roleCheck('admin', 'dispatcher'),
  validate(routeSchema.partial()),
  routeController.updateRoute,
);
router.delete('/:id', roleCheck('admin', 'dispatcher'), routeController.deleteRoute);

export default router;
