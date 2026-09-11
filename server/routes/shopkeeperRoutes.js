import express from 'express';
import {
  createShop,
  getMyShop,
  updateShop,
  getShopkeeperStats,
  getShopkeeperProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  getShopkeeperOrders,
  updateOrderStatus,
  getShopkeeperCoupons,
  createShopkeeperCoupon,
  updateShopkeeperCoupon,
  toggleShopkeeperCoupon,
  deleteShopkeeperCoupon,
} from '../controllers/shopkeeperController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

import {
  verifyShopkeeperUpiPayment,
  rejectShopkeeperUpiPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes require authentication & SHOPKEEPER role
router.use(protect, authorizeRoles('SHOPKEEPER'));

router.get('/stats', getShopkeeperStats);

router.post('/shop', createShop);
router.get('/shop', getMyShop);
router.put('/shop', updateShop);

router.get('/products', getShopkeeperProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/inventory', getInventory);

router.get('/orders', getShopkeeperOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:orderId/verify-payment', verifyShopkeeperUpiPayment);
router.patch('/orders/:orderId/reject-payment', rejectShopkeeperUpiPayment);

// Coupon management routes
router.get('/coupons', getShopkeeperCoupons);
router.post('/coupons', createShopkeeperCoupon);
router.put('/coupons/:id', updateShopkeeperCoupon);
router.patch('/coupons/:id/toggle', toggleShopkeeperCoupon);
router.delete('/coupons/:id', deleteShopkeeperCoupon);

export default router;
