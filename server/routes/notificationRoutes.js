import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';
import { enrichUser } from '../middleware/enrichUser.js';

const router = Router();

router.use(auth, enrichUser);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
