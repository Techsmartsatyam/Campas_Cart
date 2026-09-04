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
