import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { sendPushToTokens } from '../services/pushNotificationService.js';

/**
 * Recalculate and update aggregate average rating & total ratings for a Product, Shop, or Delivery Boy
 */
const updateTargetRatingAggregate = async (type, targetId) => {
  if (!targetId) return;

  try {
    let matchQuery = { isActive: true, type };
    if (type === 'PRODUCT') matchQuery.product = new mongoose.Types.ObjectId(targetId);
    else if (type === 'SHOP') matchQuery.shop = new mongoose.Types.ObjectId(targetId);
    else if (type === 'DELIVERY') matchQuery.deliveryBoy = new mongoose.Types.ObjectId(targetId);

    const stats = await Review.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalRatings = stats.length > 0 ? stats[0].totalRatings : 0;

    if (type === 'PRODUCT') {
      await Product.findByIdAndUpdate(targetId, { rating: avgRating, totalRatings });
    } else if (type === 'SHOP') {
      await Shop.findByIdAndUpdate(targetId, { rating: avgRating, totalRatings });
    } else if (type === 'DELIVERY') {
      await User.findByIdAndUpdate(targetId, { rating: avgRating, totalRatings });
    }
  } catch (error) {
    console.error(`Error updating rating aggregate for ${type} ${targetId}:`, error);
  }
};

/**
 * Helper to dispatch notification & Socket event to recipient
 */
const notifyRecipient = async (recipientId, title, message, relatedOrderId) => {
  try {
    if (!recipientId) return;

    const notification = await Notification.create({
      user: recipientId,
      title,
      message,
      type: 'REVIEW',
      relatedOrder: relatedOrderId || null,
    });

    // Try Socket.IO emit
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${recipientId.toString()}`).emit('notification', notification);
      }
    } catch (e) {
      // Socket not ready or error
    }

    // Try FCM push notification
    try {
      const recipientUser = await User.findById(recipientId).select('pushTokens');
      if (recipientUser && recipientUser.pushTokens && recipientUser.pushTokens.length > 0) {
        const activeTokens = recipientUser.pushTokens
          .filter((t) => t.isActive !== false && t.token)
          .map((t) => t.token);

        if (activeTokens.length > 0) {
          await sendPushToTokens(
            activeTokens,
            {
              title,
              body: message,
              type: 'REVIEW',
              url: '/notifications',
            },
            recipientId
          );
        }
      }
    } catch (e) {
      // FCM fail safe
    }
  } catch (err) {
    console.error('Failed to dispatch review notification:', err);
  }
};

/**
 * @desc    Submit a review (PRODUCT, SHOP, or DELIVERY)
 * @route   POST /api/reviews
 * @access  Private (STUDENT only)
 */
export const createReview = async (req, res, next) => {
  try {
    const { type, orderId, productId, shopId, deliveryBoyId, rating, comment } = req.body;

    // 1. Basic payload validations
    if (!type || !['PRODUCT', 'SHOP', 'DELIVERY'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review type. Must be PRODUCT, SHOP, or DELIVERY.',
      });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required.',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (trimmedComment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters.',
      });
    }

    // 2. Fetch and verify order ownership & DELIVERED status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only review orders placed by your account.',
      });
    }

    if (order.orderStatus !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for delivered orders.',
      });
    }

    let finalProduct = null;
    let finalShop = order.shop;
    let finalDeliveryBoy = null;

    // 3. Strict verification per review type
    if (type === 'PRODUCT') {
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid product ID is required for a product review.',
        });
      }

      // Check product is in order items
      const isProductInOrder = order.items.some(
        (item) => item.product && item.product.toString() === productId
      );

      if (!isProductInOrder) {
        return res.status(400).json({
          success: false,
          message: 'Product was not part of this delivered order.',
        });
      }

      finalProduct = productId;
    } else if (type === 'SHOP') {
      // Derive shop from order
      finalShop = order.shop;
    } else if (type === 'DELIVERY') {
      // Find delivery record for order
      const delivery = await Delivery.findOne({ order: orderId });
      if (!delivery || !delivery.deliveryBoy) {
        return res.status(400).json({
          success: false,
          message: 'No delivery partner was assigned to this order.',
        });
      }

      finalDeliveryBoy = delivery.deliveryBoy;
    }

    // 4. Duplicate Review Check
    let duplicateQuery = {
      user: req.user._id,
      order: orderId,
      type,
      isActive: true,
    };

    if (type === 'PRODUCT') duplicateQuery.product = finalProduct;
    if (type === 'SHOP') duplicateQuery.shop = finalShop;
    if (type === 'DELIVERY') duplicateQuery.deliveryBoy = finalDeliveryBoy;

    const existingReview = await Review.findOne(duplicateQuery);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted a ${type.toLowerCase()} review for this order.`,
      });
    }

    // 5. Create Review
    const review = await Review.create({
      user: req.user._id,
      order: orderId,
      type,
      product: finalProduct,
      shop: finalShop,
      deliveryBoy: finalDeliveryBoy,
      rating: numericRating,
      comment: trimmedComment,
      isActive: true,
    });

    // 6. Update Target Aggregate Rating
    const targetId = type === 'PRODUCT' ? finalProduct : type === 'SHOP' ? finalShop : finalDeliveryBoy;
    await updateTargetRatingAggregate(type, targetId);

    // 7. Send notification to shopkeeper or delivery boy
    if (type === 'SHOP' || type === 'PRODUCT') {
      const shopDoc = await Shop.findById(finalShop).select('owner name');
      if (shopDoc && shopDoc.owner) {
        const itemText = type === 'SHOP' ? `your shop (${shopDoc.name})` : 'a product in your shop';
        await notifyRecipient(
          shopDoc.owner,
          `New ${type === 'SHOP' ? 'Shop' : 'Product'} Review ⭐`,
          `A student left a ${numericRating}-star review for ${itemText}.`,
          orderId
        );
      }
    } else if (type === 'DELIVERY' && finalDeliveryBoy) {
      await notifyRecipient(
        finalDeliveryBoy,
        'New Delivery Review ⭐',
        `A student rated your delivery service ${numericRating} stars!`,
        orderId
      );
    }

    const populatedReview = await Review.findById(review._id).populate('user', 'name profileImage');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate review rejected. You have already reviewed this target for this order.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const query = { product: productId, type: 'PRODUCT', isActive: true };

    const [reviews, totalCount, stats, distribution] = await Promise.all([
      Review.find(query)
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), type: 'PRODUCT', isActive: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), type: 'PRODUCT', isActive: true } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((item) => {
      if (starCounts[item._id] !== undefined) starCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: reviews,
      avgRating,
      totalRatings: totalCount,
      starCounts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for a shop
 * @route   GET /api/reviews/shop/:shopId
 * @access  Public
 */
export const getShopReviews = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ success: false, message: 'Invalid shop ID format' });
    }

    const query = { shop: shopId, type: 'SHOP', isActive: true };

    const [reviews, totalCount, stats, distribution] = await Promise.all([
      Review.find(query)
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { shop: new mongoose.Types.ObjectId(shopId), type: 'SHOP', isActive: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
      Review.aggregate([
        { $match: { shop: new mongoose.Types.ObjectId(shopId), type: 'SHOP', isActive: true } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((item) => {
      if (starCounts[item._id] !== undefined) starCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: reviews,
      avgRating,
      totalRatings: totalCount,
      starCounts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for a delivery boy
 * @route   GET /api/reviews/delivery/:deliveryBoyId
 * @access  Private / Public
 */
export const getDeliveryBoyReviews = async (req, res, next) => {
  try {
    const { deliveryBoyId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(deliveryBoyId)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery boy ID format' });
    }

    const query = { deliveryBoy: deliveryBoyId, type: 'DELIVERY', isActive: true };

    const [reviews, totalCount, stats] = await Promise.all([
      Review.find(query)
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { deliveryBoy: new mongoose.Types.ObjectId(deliveryBoyId), type: 'DELIVERY', isActive: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

    return res.status(200).json({
      success: true,
      data: reviews,
      avgRating,
      totalRatings: totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for an order (to display rating status per item)
 * @route   GET /api/reviews/order/:orderId
 * @access  Private (STUDENT / SHOPKEEPER / DELIVERY_BOY / ADMIN)
 */
export const getOrderReviews = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const reviews = await Review.find({ order: orderId, isActive: true })
      .populate('user', 'name profileImage')
      .populate('product', 'name images price')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all product reviews for shopkeeper's shop
 * @route   GET /api/reviews/shopkeeper/overview
 * @access  Private (SHOPKEEPER)
 */
export const getShopkeeperReviewsOverview = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { shop: shop._id, isActive: true };

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('user', 'name profileImage')
        .populate('product', 'name images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      shopRating: shop.rating || 0,
      totalShopRatings: shop.totalRatings || 0,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (Author only)
 */
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const review = await Review.findById(reviewId);
    if (!review || !review.isActive) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this review' });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }
      review.rating = numericRating;
    }

    if (comment !== undefined) {
      const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
      if (trimmedComment.length > 500) {
        return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });
      }
      review.comment = trimmedComment;
    }

    await review.save();

    // Re-aggregate rating for target
    const targetId = review.type === 'PRODUCT' ? review.product : review.type === 'SHOP' ? review.shop : review.deliveryBoy;
    await updateTargetRatingAggregate(review.type, targetId);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete / deactivate a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Author or ADMIN)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isAuthor = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this review' });
    }

    review.isActive = false;
    await review.save();

    // Re-aggregate rating for target
    const targetId = review.type === 'PRODUCT' ? review.product : review.type === 'SHOP' ? review.shop : review.deliveryBoy;
    await updateTargetRatingAggregate(review.type, targetId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for Admin dashboard
 * @route   GET /api/reviews/admin/all
 * @access  Private (ADMIN only)
 */
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.type && ['PRODUCT', 'SHOP', 'DELIVERY'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const [reviews, totalCount] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name email profileImage')
        .populate('shop', 'name')
        .populate('product', 'name')
        .populate('deliveryBoy', 'name email')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
