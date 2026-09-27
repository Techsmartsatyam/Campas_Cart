import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

// Protect all cart routes for STUDENT only
router.use(protect);
router.use(authorizeRoles('STUDENT'));

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:productId', updateCartItem);
router.delete('/item/:productId', removeCartItem);
router.delete('/clear', clearCart);

export default router;
