import mongoose from 'mongoose';
import User from '../models/User.js';

// @route   GET /api/admin/users
// @desc    Get all users list for admin user management
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/staff
// @desc    Get list of staff members (SHOPKEEPER & DELIVERY_BOY)
// @access  Private/Admin
export const getStaffMembers = async (req, res, next) => {
  try {
    const staff = await User.find({
      role: { $in: ['SHOPKEEPER', 'DELIVERY_BOY'] },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:id/status
// @desc    Block or Unblock a user (toggle isActive)
// @access  Private/Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean property is required in request body.',
      });
    }

    // Do not allow admin to block themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot block their own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Do not allow blocking of other ADMIN users
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify status of an Administrator account.',
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.role}) has been ${isActive ? 'unblocked' : 'blocked'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview estimated document counts for cleanup targets
 * @route   POST /api/admin/clean-data/preview
 * @access  Private/Admin
 */
export const previewCleanData = async (req, res, next) => {
  try {
    const { targets = [] } = req.body;

    const targetList = Array.isArray(targets) ? targets : [];

    const counts = {
      orders: targetList.includes('orders') ? await mongoose.model('Order').countDocuments() : 0,
      deliveries: targetList.includes('deliveries') ? await mongoose.model('Delivery').countDocuments() : 0,
      reviews: targetList.includes('reviews') ? await mongoose.model('Review').countDocuments() : 0,
      notifications: targetList.includes('notifications') ? await mongoose.model('Notification').countDocuments() : 0,
      carts: targetList.includes('carts') ? await mongoose.model('Cart').countDocuments() : 0,
      testUsers: targetList.includes('testUsers') ? await User.countDocuments({ role: 'STUDENT' }) : 0,
    };

    return res.status(200).json({
      success: true,
      counts,
      message: 'Preview document counts calculated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Execute safe allowlist PRE-LAUNCH app data cleanup
 * @route   POST /api/admin/clean-data
 * @access  Private/Admin
 */
export const executeCleanData = async (req, res, next) => {
  try {
    const { targets = [], confirmation, password } = req.body;

    // 1. Confirm strict ADMIN authorization
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin authorization required.',
      });
    }

    // 2. Validate confirmation phrase
    if (confirmation !== 'CLEAN NEARCART') {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation string. You must type "CLEAN NEARCART" to confirm cleanup.',
      });
    }

    // 3. Re-authenticate Admin password if provided or required
    if (password) {
      const adminUser = await User.findById(req.user._id).select('+password');
      if (!adminUser) {
        return res.status(401).json({ success: false, message: 'Admin account not found.' });
      }
      const isPasswordValid = await adminUser.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid administrator password confirmation.',
        });
      }
    }

    // 4. Validate targets array
    const validTargetKeys = ['orders', 'deliveries', 'reviews', 'notifications', 'carts', 'testUsers'];
    const selectedTargets = (Array.isArray(targets) ? targets : []).filter((t) =>
      validTargetKeys.includes(t)
    );

    if (selectedTargets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid cleanup targets selected.',
      });
    }

    const Order = mongoose.model('Order');
    const Delivery = mongoose.model('Delivery');
    const Review = mongoose.model('Review');
    const Notification = mongoose.model('Notification');
    const Cart = mongoose.model('Cart');
    const Payment = mongoose.model('Payment');
    const Address = mongoose.model('Address');
    const Product = mongoose.model('Product');
    const Shop = mongoose.model('Shop');

    const deletedSummary = {
      orders: 0,
      deliveries: 0,
      reviews: 0,
      notifications: 0,
      carts: 0,
      testUsers: 0,
      payments: 0,
    };

    // 5. Ordered Deletion Execution

    // A. ORDERS
    if (selectedTargets.includes('orders')) {
      const orders = await Order.find().select('_id');
      const orderIds = orders.map((o) => o._id);

      if (orderIds.length > 0) {
        const payRes = await Payment.deleteMany({ order: { $in: orderIds } });
        deletedSummary.payments = payRes.deletedCount || 0;

        const delRes = await Delivery.deleteMany({ order: { $in: orderIds } });
        deletedSummary.deliveries += delRes.deletedCount || 0;

        const revRes = await Review.deleteMany({ order: { $in: orderIds } });
        deletedSummary.reviews += revRes.deletedCount || 0;

        const notifRes = await Notification.deleteMany({ relatedOrder: { $in: orderIds } });
        deletedSummary.notifications += notifRes.deletedCount || 0;

        const ordRes = await Order.deleteMany({ _id: { $in: orderIds } });
        deletedSummary.orders = ordRes.deletedCount || 0;
      }
    }

    // B. DELIVERIES (if selected standalone)
    if (selectedTargets.includes('deliveries') && !selectedTargets.includes('orders')) {
      const delRes = await Delivery.deleteMany({});
      deletedSummary.deliveries += delRes.deletedCount || 0;
    }

    // C. REVIEWS (and rating recalculations / resets)
    if (selectedTargets.includes('reviews')) {
      const revRes = await Review.deleteMany({});
      deletedSummary.reviews += revRes.deletedCount || 0;

      // Reset rating aggregates on Master Collections to 0
      await Product.updateMany({}, { rating: 0, totalRatings: 0 });
      await Shop.updateMany({}, { rating: 0, totalRatings: 0 });
      await User.updateMany({ role: 'DELIVERY_BOY' }, { rating: 0, totalRatings: 0 });
    }

    // D. NOTIFICATIONS
    if (selectedTargets.includes('notifications')) {
      const notifRes = await Notification.deleteMany({});
      deletedSummary.notifications += notifRes.deletedCount || 0;
    }

    // E. CARTS
    if (selectedTargets.includes('carts')) {
      const cartRes = await Cart.deleteMany({});
      deletedSummary.carts += cartRes.deletedCount || 0;
    }

    // F. TEST / STUDENT USERS
    if (selectedTargets.includes('testUsers')) {
      // Find all STUDENT users (Excludes ADMIN, SHOPKEEPER, DELIVERY_BOY)
      const students = await User.find({ role: 'STUDENT' }).select('_id');
      const studentIds = students.map((s) => s._id);

      if (studentIds.length > 0) {
        await Address.deleteMany({ user: { $in: studentIds } });
        await Cart.deleteMany({ user: { $in: studentIds } });
        const userRes = await User.deleteMany({ role: 'STUDENT' });
        deletedSummary.testUsers = userRes.deletedCount || 0;
      }
    }

    // Audit Logging (Safe server log)
    console.log(`[AUDIT CLEANUP] Admin ${req.user._id} (${req.user.email}) performed pre-launch data cleanup.`);
    console.log(`[AUDIT CLEANUP] Targets: ${selectedTargets.join(', ')} | Summary:`, deletedSummary);

    return res.status(200).json({
      success: true,
      message: 'NearCart pre-launch cleanup completed successfully.',
      deletedCounts: deletedSummary,
      preserved: [
        'Admin accounts',
        'Shopkeeper accounts',
        'Delivery Boy accounts',
        'Shops & Master Settings',
        'Products & Images',
        'Categories',
        'App Configuration',
      ],
    });
  } catch (error) {
    next(error);
  }
};

