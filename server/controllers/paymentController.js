import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Get shop-specific UPI QR details for a Student's specific Order
 * @route   GET /api/payments/qr/:orderId
 * @access  Private (Student)
 */
export const getOrderPaymentQr = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId).populate('shop', 'name upiEnabled upiId upiQrImage logo owner');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Student can ONLY view payment QR for their own order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order payment QR' });
    }

    const shop = order.shop || {};
    // Use snapshot if available, otherwise shop's current QR
    const qrImage = order.upiQrSnapshot?.imageUrl || shop.upiQrImage || '';
    const upiId = order.upiQrSnapshot?.upiId || shop.upiId || '';

    return res.status(200).json({
      success: true,
      shopName: shop.name || 'Campus Shop',
      totalAmount: order.totalAmount,
      upiEnabled: shop.upiEnabled !== false,
      upiId,
      upiQrImage: qrImage,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student confirms UPI payment ("I Have Paid")
 * @route   POST /api/payments/upi/confirm
 * @access  Private (Student)
 */
export const confirmUpiPayment = async (req, res, next) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Student can only confirm their own order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized payment confirmation attempt' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Order is already marked as PAID' });
    }

    const now = new Date();

    // Prevent duplicate confirmation if already USER_CONFIRMED
    if (order.paymentStatus === 'USER_CONFIRMED') {
      return res.status(200).json({
        success: true,
        message: 'Payment confirmation already submitted. Waiting for shopkeeper verification.',
        order,
      });
    }

    order.paymentStatus = 'USER_CONFIRMED';
    await order.save();

    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: req.user._id,
        amount: order.totalAmount,
        method: 'UPI',
      });
    }

    payment.status = 'USER_CONFIRMED';
    payment.method = 'UPI';
    payment.transactionId = transactionId || payment.transactionId || `UPI_TXN_${Date.now()}`;
    payment.studentConfirmedAt = now;
    await payment.save();

    // Create Notification for Shopkeeper
    try {
      const shop = await mongoose.model('Shop').findById(order.shop);
      if (shop && shop.owner) {
        await Notification.create({
          user: shop.owner,
          title: 'UPI Payment Claimed',
          message: `Student marked payment as completed for Order ${order.orderNumber}. Please verify.`,
          type: 'ORDER',
          relatedOrder: order._id,
          isRead: false,
        });
      }

      // Socket.IO event emission
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      io.to(`delivery:${order._id}`).emit('payment:user_confirmed', {
        orderId: order._id,
        paymentStatus: 'USER_CONFIRMED',
      });
    } catch (notifErr) {
      console.warn('UPI confirmation notification notice:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmation submitted successfully. Waiting for shopkeeper verification.',
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Shopkeeper verifies UPI payment ("Verify Payment")
 * @route   PATCH /api/shopkeeper/orders/:orderId/verify-payment
 * @access  Private (Shopkeeper)
 */
export const verifyShopkeeperUpiPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('shop');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Only owner of order's shop can verify payment
    if (order.shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized verification attempt for another shop order' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and marked as PAID.',
        order,
      });
    }

    const now = new Date();
    order.paymentStatus = 'PAID';
    await order.save();

    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: order.user,
        amount: order.totalAmount,
        method: 'UPI',
      });
    }

    payment.status = 'SUCCESS';
    payment.verifiedAt = now;
    payment.paidAt = now;
    payment.verifiedBy = req.user._id;
    await payment.save();

    // Create Notification for Student
    try {
      await Notification.create({
        user: order.user,
        title: 'UPI Payment Verified',
        message: `Your UPI payment for Order ${order.orderNumber} has been verified by the shopkeeper!`,
        type: 'ORDER',
        relatedOrder: order._id,
        isRead: false,
      });

      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      io.to(`delivery:${order._id}`).emit('payment:verified', {
        orderId: order._id,
        paymentStatus: 'PAID',
      });
    } catch (notifErr) {
      console.warn('UPI verification notification notice:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'UPI Payment verified successfully!',
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Shopkeeper marks payment as NOT received ("Payment Not Received")
 * @route   PATCH /api/shopkeeper/orders/:orderId/reject-payment
 * @access  Private (Shopkeeper)
 */
export const rejectShopkeeperUpiPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('shop');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized action for another shop order' });
    }

    order.paymentStatus = 'FAILED';
    await order.save();

    let payment = await Payment.findOne({ order: order._id });
    if (payment) {
      payment.status = 'FAILED';
      await payment.save();
    }

    try {
      await Notification.create({
        user: order.user,
        title: 'Payment Verification Unsuccessful',
        message: `Payment for Order ${order.orderNumber} could not be verified by the shopkeeper. Please contact shopkeeper.`,
        type: 'ORDER',
        relatedOrder: order._id,
        isRead: false,
      });
    } catch (nErr) {
      console.warn('Payment reject notification notice:', nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment set to unverified / failed.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate & stream official PDF Payment Receipt
 * @route   GET /api/orders/:orderId/receipt
 * @access  Private (Student / Shopkeeper / Admin)
 */
export const generateReceiptPdf = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid Order ID is required' });
    }

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('shop', 'name phone address owner')
      .populate('address');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: Student owner, Shop owner, or Admin
    const isStudentOwner = req.user.role === 'STUDENT' && order.user._id.toString() === req.user._id.toString();
    const isShopOwner = req.user.role === 'SHOPKEEPER' && order.shop.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isStudentOwner && !isShopOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order receipt' });
    }

    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Receipt is available only for PAID / VERIFIED orders' });
    }

    const payment = await Payment.findOne({ order: order._id });

    // Dynamic import PDFDocument safely
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CampusCart-Receipt-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fillColor('#0284c7').fontSize(22).text('CAMPUSCART', { align: 'center', underline: true });
    doc.fillColor('#334155').fontSize(12).text('Digital Payment Receipt', { align: 'center' });
    doc.moveDown(1.5);

    // Metadata Grid
    doc.fontSize(10).fillColor('#0f172a');
    doc.text(`Order Number: ${order.orderNumber}`, 40);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`);
    doc.text(`Payment Verified Date: ${payment?.verifiedAt ? new Date(payment.verifiedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}`);
    doc.moveDown();

    doc.text(`Customer Name: ${order.user?.name || 'Student'}`);
    doc.text(`Customer Phone: ${order.user?.phone || 'N/A'}`);
    doc.text(`Delivery Address: ${order.address?.fullAddress || 'Campus Address'}`);
    doc.moveDown();

    doc.text(`Shop Name: ${order.shop?.name || 'Campus Shop'}`);
    doc.text(`Shop Address: ${order.shop?.address || 'N/A'}`);
    doc.moveDown(1.5);

    // Table Header
    doc.fillColor('#0284c7').fontSize(11).text('ITEM DETAILS', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(9).fillColor('#475569');
    doc.text('Item Description', 40, doc.y, { width: 250 });
    doc.text('Qty', 300, doc.y, { width: 50 });
    doc.text('Price', 360, doc.y, { width: 60 });
    doc.text('Subtotal', 440, doc.y, { width: 80 });
    doc.moveDown(0.3);
    doc.text('---------------------------------------------------------------------------------------------------');
    doc.moveDown(0.5);

    doc.fillColor('#0f172a');
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.name, 40, y, { width: 250 });
        doc.text(item.quantity.toString(), 300, y, { width: 50 });
        doc.text(`INR ${item.price.toFixed(2)}`, 360, y, { width: 60 });
        doc.text(`INR ${item.subtotal.toFixed(2)}`, 440, y, { width: 80 });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.text('---------------------------------------------------------------------------------------------------');
    doc.moveDown(0.5);

    // Summary Totals
    doc.text(`Subtotal: INR ${order.subtotal.toFixed(2)}`, 360);
    doc.text(`Delivery Fee: INR ${order.deliveryFee.toFixed(2)}`, 360);
    if (order.discount > 0) doc.text(`Discount: -INR ${order.discount.toFixed(2)}`, 360);
    doc.fontSize(11).fillColor('#10b981').text(`TOTAL PAID: INR ${order.totalAmount.toFixed(2)}`, 360);
    doc.moveDown(1.5);

    // Payment Meta
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: VERIFIED`);
    if (order.upiQrSnapshot?.upiId) {
      doc.text(`UPI ID: ${order.upiQrSnapshot.upiId}`);
    }
    doc.text(`Payment Reference: ${payment?.transactionId || 'Not provided'}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text('Thank you for ordering with CampusCart!', { align: 'center' });
    doc.text('This is an official computer-generated receipt.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    next(error);
  }
};

/**
 * @desc    Handle Razorpay Webhook Events securely using Raw Body HMAC
 * @route   POST /api/payments/webhook
 * @access  Public (Razorpay Webhook)
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_razorpay_webhook_secret_2026';

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay webhook signature' });
    }

    // Verify raw body signature
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const razorpayOrderId = paymentEntity ? paymentEntity.order_id : null;
      const razorpayPaymentId = paymentEntity ? paymentEntity.id : null;

      if (razorpayOrderId) {
        const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });
        if (payment && payment.status !== 'SUCCESS') {
          payment.status = 'SUCCESS';
          payment.providerPaymentId = razorpayPaymentId || payment.providerPaymentId;
          payment.paidAt = new Date();
          await payment.save();

          const order = await Order.findById(payment.order);
          if (order && order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'PAID';
            await order.save();
          }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const razorpayOrderId = paymentEntity ? paymentEntity.order_id : null;

      if (razorpayOrderId) {
        const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });
        if (payment && payment.status !== 'SUCCESS') {
          payment.status = 'FAILED';
          await payment.save();

          const order = await Order.findById(payment.order);
          if (order && order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'FAILED';
            await order.save();
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

/**
 * @desc    Get payment visibility data for Admin / Student / Shopkeeper
 * @route   GET /api/payments
 * @access  Private
 */
export const getPayments = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'STUDENT') {
      filter.user = req.user._id;
    } else if (req.user.role === 'SHOPKEEPER') {
      const shopOrders = await Order.find({ shop: req.user.shopId }).select('_id');
      const orderIds = shopOrders.map((o) => o._id);
      filter.order = { $in: orderIds };
    }
    // Admin gets all payments (filter = {})

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber orderStatus paymentStatus paymentMethod totalAmount createdAt')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Aggregate statistics for Admin if role is ADMIN
    let stats = null;
    if (req.user.role === 'ADMIN') {
      const totalCount = payments.length;
      const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
      const failedCount = payments.filter((p) => p.status === 'FAILED').length;
      const pendingCount = payments.filter((p) => p.status === 'PENDING' || p.status === 'CREATED').length;
      const codCount = payments.filter((p) => p.method === 'COD').length;
      const onlineCount = payments.filter((p) => p.method === 'RAZORPAY').length;
      const totalRevenue = payments
        .filter((p) => p.status === 'SUCCESS' || (p.method === 'COD' && p.order?.paymentStatus === 'PAID'))
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      stats = {
        totalPayments: totalCount,
        successfulPayments: successCount,
        failedPayments: failedCount,
        pendingPayments: pendingCount,
        codPayments: codCount,
        onlinePayments: onlineCount,
        totalRevenue,
      };
    }

    return res.status(200).json({
      success: true,
      stats,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};
