import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);

export default router;
