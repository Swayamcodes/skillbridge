import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, notificationController.getNotifications);
router.put('/read-all', requireAuth, notificationController.markAllAsRead);
router.put('/:id/read', requireAuth, notificationController.markAsRead);

export default router;
