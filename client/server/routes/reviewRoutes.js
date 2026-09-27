import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  createReview,
  getProductReviews,
  getShopReviews,
  getDeliveryBoyReviews,
  getOrderReviews,
  getShopkeeperReviewsOverview,
  getAllReviewsAdmin,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes for fetching ratings & reviews
router.get('/product/:productId', getProductReviews);
router.get('/shop/:shopId', getShopReviews);
router.get('/delivery/:deliveryBoyId', getDeliveryBoyReviews);

// Protected routes
router.post('/', protect, authorizeRoles('STUDENT'), createReview);
router.get('/order/:orderId', protect, getOrderReviews);
router.get('/shopkeeper/overview', protect, authorizeRoles('SHOPKEEPER'), getShopkeeperReviewsOverview);
router.get('/admin/all', protect, authorizeRoles('ADMIN'), getAllReviewsAdmin);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
