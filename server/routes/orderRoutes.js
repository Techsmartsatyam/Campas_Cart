import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  applyCoupon,
  cancelOrder,
} from '../controllers/orderController.js';
import {
  getOrderPaymentQr,
  generateReceiptPdf,
} from '../controllers/paymentController.js';

const router = express.Router();

router.use(protect);

// User endpoints
router.post('/apply-coupon', authorizeRoles('USER'), applyCoupon);
router.post('/', authorizeRoles('USER'), createOrder);
router.get('/', authorizeRoles('USER'), getUserOrders);
router.patch('/:id/cancel', authorizeRoles('USER'), cancelOrder);
router.get('/:orderId/payment-qr', getOrderPaymentQr);
router.get('/:orderId/receipt', generateReceiptPdf);
router.get('/:id', getOrderById); // Order details verification handles role check inside controller

export default router;
