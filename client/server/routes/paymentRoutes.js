import express from 'express';
import {
  getOrderPaymentQr,
  getPayments,
  confirmUpiPayment,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected endpoints
router.use(protect);

router.get('/qr/:orderId', getOrderPaymentQr);
router.post('/upi/confirm', confirmUpiPayment);
router.get('/', getPayments);

export default router;
