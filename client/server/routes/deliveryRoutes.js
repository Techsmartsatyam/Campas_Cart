import express from 'express';
import {
  getAvailableOrders,
  acceptDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication & DELIVERY_BOY role
router.use(protect, authorizeRoles('DELIVERY_BOY'));

router.get('/available-orders', getAvailableOrders);
router.patch('/orders/:orderId/accept', acceptDelivery);
router.get('/my-deliveries', getMyDeliveries);
router.get('/my-orders', getMyDeliveries); // Alias for my-orders requirement
router.get('/:id', getDeliveryById);
router.patch('/:id/status', updateDeliveryStatus);

export default router;
