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

export default router;
