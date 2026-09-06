import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

/**
 * @desc    Get notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count for authenticated user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for authenticated user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register or update FCM device token for authenticated user
 * @route   POST /api/notifications/device-token
 * @access  Private
 */
export const registerDeviceToken = async (req, res, next) => {
  try {
    const { token, platform = 'web' } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid FCM device token is required',
      });
    }

    const trimmedToken = token.trim();

    // Pull token from any other user to prevent cross-account duplicate push targets
    await User.updateMany(
      { _id: { $ne: req.user._id }, 'pushTokens.token': trimmedToken },
      { $pull: { pushTokens: { token: trimmedToken } } }
    );

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    const existingTokenIndex = user.pushTokens.findIndex(
      (t) => t.token === trimmedToken
    );

    if (existingTokenIndex >= 0) {
      user.pushTokens[existingTokenIndex].updatedAt = new Date();
      user.pushTokens[existingTokenIndex].isActive = true;
      user.pushTokens[existingTokenIndex].platform = platform;
    } else {
      user.pushTokens.push({
        token: trimmedToken,
        platform,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate/remove FCM device token for authenticated user
 * @route   DELETE /api/notifications/device-token
 * @access  Private
 */
export const removeDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
    }

    const trimmedToken = token.trim();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushTokens: { token: trimmedToken } },
    });

    return res.status(200).json({
      success: true,
      message: 'Device token removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
