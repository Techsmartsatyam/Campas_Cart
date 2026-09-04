import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Address from '../models/Address.js';
import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';

/**
 * Helper to generate human-readable unique order number: CC-2026-XXXXXX
 */
const generateOrderNumber = () => {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CC-2026-${randomHex}`;
};

/**
 * @desc    Validate and apply a coupon
 * @route   POST /api/orders/apply-coupon
 * @access  Private (Student)
 */
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;

    if (!couponCode || !couponCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const orderSubtotal = parseFloat(subtotal);
    if (isNaN(orderSubtotal) || orderSubtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid subtotal is required to apply coupon',
      });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive coupon code',
      });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or not yet active',
      });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached',
      });
    }

    if (orderSubtotal < coupon.minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderSubtotal * coupon.discountValue) / 100;
      if (coupon.maximumDiscount !== null && coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, orderSubtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new order from Student's cart
 * @route   POST /api/orders
 * @access  Private (Student)
 */
export const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod = 'COD', couponCode, notes } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }

    if (!['COD', 'UPI', 'ONLINE'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose COD, UPI, or ONLINE.',
      });
    }

    // 1. Verify delivery address belongs to student
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found',
      });
    }

    // 2. Fetch student's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty',
      });
    }

    // 3. Verify shop validity
    const shopId = cart.items[0].shop;
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isApproved || !shop.isActive) {
      return res.status(400).json({
        success: false,
        message: 'The shop associated with your cart is not available',
      });
    }

    // 4. Validate products, stock, & recalculate subtotal server-side
    let calculatedSubtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id || item.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product in cart no longer exists`,
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is currently unavailable`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} left.`,
        });
      }

      const itemSubtotal = product.price * item.quantity;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
      });

      stockUpdates.push({
        product,
        newStock: product.stock - item.quantity,
      });
    }

    // Check shop minimum order amount safely
    const minOrderAmt = shop.minimumOrderAmount !== undefined ? shop.minimumOrderAmount : (shop.minimumOrder || 0);
    if (minOrderAmt > 0 && calculatedSubtotal < minOrderAmt) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${minOrderAmt} required for ${shop.name}`,
      });
    }

    // 5. Calculate delivery fee
    const deliveryFee = shop.deliveryFee !== undefined ? shop.deliveryFee : 0;

    // 6. Validate & calculate coupon discount server-side if provided
    let discountAmount = 0;
    let couponDoc = null;
    if (couponCode && couponCode.trim()) {
      couponDoc = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      });

      if (couponDoc) {
        const now = new Date();
        const validDates = now >= new Date(couponDoc.startDate) && now <= new Date(couponDoc.endDate);
        const validLimit = couponDoc.usageLimit === null || couponDoc.usedCount < couponDoc.usageLimit;
        const validMinOrder = calculatedSubtotal >= couponDoc.minimumOrderAmount;

        if (validDates && validLimit && validMinOrder) {
          if (couponDoc.discountType === 'PERCENTAGE') {
            discountAmount = (calculatedSubtotal * couponDoc.discountValue) / 100;
            if (couponDoc.maximumDiscount && couponDoc.maximumDiscount > 0) {
              discountAmount = Math.min(discountAmount, couponDoc.maximumDiscount);
            }
          } else if (couponDoc.discountType === 'FIXED') {
            discountAmount = couponDoc.discountValue;
          }
          discountAmount = Math.min(discountAmount, calculatedSubtotal);
          discountAmount = Math.round(discountAmount * 100) / 100;
        }
      }
    }

    // 7. Calculate total amount
    const totalAmount = Math.max(0, calculatedSubtotal + deliveryFee - discountAmount);

    // 8. Generate unique order number with retry on collision
    let orderNumber = generateOrderNumber();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const existing = await Order.findOne({ orderNumber });
      if (!existing) {
        isUnique = true;
      } else {
        orderNumber = generateOrderNumber();
        attempts++;
      }
    }

    // Capture upiQrSnapshot from shop
    const upiQrSnapshot = {
      upiId: shop.upiId || '',
      imageUrl: shop.upiQrImage || '',
      upiQrImage: shop.upiQrImage || '',
    };

    // 9. Create Order Document
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      shop: shop._id,
      items: orderItems,
      address: address._id,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discount: discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: 'PENDING',
      upiQrSnapshot,
      orderStatus: 'PLACED',
      notes: notes ? notes.trim() : '',
    });

    // 9b. Create initial unassigned Delivery Record (status: PENDING, deliveryBoy: null)
    try {
      const Delivery = (await import('../models/Delivery.js')).default;
      await Delivery.create({
        order: order._id,
        deliveryBoy: null,
        status: 'PENDING',
      });
    } catch (delErr) {
      console.warn('Initial Delivery document creation notice:', delErr.message);
    }

    // Create corresponding Payment document if required by schema
    try {
      await Payment.create({
        order: order._id,
        user: req.user._id,
        amount: totalAmount,
        method: paymentMethod === 'COD' ? 'COD' : 'UPI',
        status: 'PENDING',
        upiQrSnapshot,
      });
    } catch (payErr) {
      console.warn('Payment document creation notice:', payErr.message);
    }

    // 10. Update stock for all ordered products safely
    for (const update of stockUpdates) {
      update.product.stock = update.newStock;
      if (update.newStock === 0) {
        update.product.isAvailable = false;
      }
      await update.product.save();
    }

    // 11. Increment coupon usage count if applied
    if (couponDoc && discountAmount > 0) {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    // 12. Clear Student's cart after successful order creation
    cart.items = [];
    await cart.save();

    await order.populate([
      { path: 'shop', select: 'name phone address bannerImage owner' },
      { path: 'address' },
      { path: 'items.product', select: 'name images unit' },
    ]);

    // 13. Create Notifications safely (Student, Shopkeeper, & Delivery Boys)
    try {
      // A. Student Order Confirmation Notification
      await Notification.create({
        user: req.user._id,
        title: 'Order Placed Successfully',
        message: `Your order ${order.orderNumber} has been placed successfully.`,
        type: 'ORDER',
        relatedOrder: order._id,
        isRead: false,
      });

      // B. Shopkeeper New Order Notification (Only shop owner)
      if (shop.owner) {
        await Notification.create({
          user: shop.owner,
          title: 'New Order Received',
          message: `New order ${order.orderNumber} has been placed for your shop.`,
          type: 'ORDER',
          relatedOrder: order._id,
          isRead: false,
        });
      }

      // C. Eligible Delivery Boys Notification
      const activeDeliveryBoys = await User.find({
        role: 'DELIVERY_BOY',
        isActive: true,
        accountStatus: 'APPROVED',
      }).select('_id');

      if (activeDeliveryBoys.length > 0) {
        const deliveryNotifications = activeDeliveryBoys.map((dbUser) => ({
          user: dbUser._id,
          title: 'New Delivery Available',
          message: `Order ${order.orderNumber} is available for delivery.`,
          type: 'DELIVERY',
          relatedOrder: order._id,
          isRead: false,
        }));
        await Notification.insertMany(deliveryNotifications);
      }
    } catch (notifErr) {
      console.warn('Order creation notification notice:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message,
    });
  }
};

/**
 * @desc    Get order history for authenticated Student
 * @route   GET /api/orders
 * @access  Private (Student)
 */
export const getStudentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('shop', 'name bannerImage address')
      .populate('address')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching student orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message,
    });
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Student / Shopkeeper / Admin / Delivery)
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shop', 'name phone address bannerImage')
      .populate('address')
      .populate('items.product', 'name images unit');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Authorization check: Student can only view their own orders
    if (req.user.role === 'STUDENT' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order details',
      });
    }

    const orderObj = order.toObject();

    // Check if a Delivery record is assigned to this order
    const delivery = await Delivery.findOne({ order: order._id }).populate('deliveryBoy', 'name phone profileImage');
    if (delivery && delivery.deliveryBoy) {
      orderObj.deliveryBoy = {
        _id: delivery.deliveryBoy._id,
        name: delivery.deliveryBoy.name,
        phone: delivery.deliveryBoy.phone,
        profileImage: delivery.deliveryBoy.profileImage || null,
      };
      orderObj.deliveryStatus = delivery.status;
    }

    return res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel order by authenticated Student
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private (Student)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to you',
      });
    }

    // Cancellation check: Student can cancel ONLY when PLACED or SHOP_ACCEPTED
    const CANCELLABLE_STATUSES = ['PLACED', 'SHOP_ACCEPTED'];
    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled once it reaches ${order.orderStatus}`,
      });
    }

    // Already cancelled check
    if (['CANCELLED', 'SHOP_REJECTED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = cancellationReason ? cancellationReason.trim() : 'Cancelled by Student';
    await order.save();

    // Safely restore product stock
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          if (product.stock > 0 && !product.isAvailable) {
            product.isAvailable = true;
          }
          await product.save();
        }
      }
    }

    await order.populate([
      { path: 'shop', select: 'name phone address bannerImage owner' },
      { path: 'address' },
      { path: 'items.product', select: 'name images unit' },
    ]);

    // Create Notification for Shopkeeper informing about Student Cancellation
    try {
      if (order.shop && order.shop.owner) {
        await Notification.create({
          user: order.shop.owner,
          title: 'Order Cancelled',
          message: `Order ${order.orderNumber} has been cancelled by the student.`,
          type: 'ORDER',
          relatedOrder: order._id,
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.warn('Student cancellation notification notice:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

