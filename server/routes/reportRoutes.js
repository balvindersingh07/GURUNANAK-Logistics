import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/role.js';

const router = Router();

router.use(auth, roleCheck('admin', 'dispatcher'));

router.get('/summary', reportController.getSummary);

export default router;
