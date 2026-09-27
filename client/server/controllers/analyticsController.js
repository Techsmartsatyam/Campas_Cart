import Installation from '../models/Installation.js';

/**
 * @desc    Register or update PWA app installation with unique installationId
 * @route   POST /api/analytics/install
 * @access  Public (Optional authenticated user)
 */
export const registerInstallation = async (req, res, next) => {
  try {
    const { installationId, platform } = req.body;

    if (!installationId || typeof installationId !== 'string' || !installationId.trim()) {
      return res.status(400).json({ success: false, message: 'Valid installationId is required' });
    }

    const cleanInstallationId = installationId.trim();
    const validPlatforms = ['android', 'ios', 'desktop', 'mobile', 'unknown'];
    const cleanPlatform = validPlatforms.includes(platform?.toLowerCase()) ? platform.toLowerCase() : 'unknown';

    const userId = req.user?._id || null;
    const now = new Date();

    const existing = await Installation.findOne({ installationId: cleanInstallationId });
    const isNew = !existing;

    // Atomic upsert: Update existing record or create new unique installation record
    const installation = await Installation.findOneAndUpdate(
      { installationId: cleanInstallationId },
      {
        $set: {
          platform: cleanPlatform,
          lastSeenAt: now,
          ...(userId && { user: userId }),
        },
        $setOnInsert: {
          installedAt: now,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: isNew ? 'App installation registered successfully' : 'App installation updated',
      installationId: installation.installationId,
      isNew,
    });
  } catch (error) {
    // Handle potential index race condition smoothly
    if (error.code === 11000) {
      try {
        const existing = await Installation.findOne({ installationId: req.body.installationId?.trim() });
        return res.status(200).json({
          success: true,
          message: 'App installation already registered',
          installationId: existing?.installationId,
          isNew: false,
        });
      } catch (findErr) {
        return next(findErr);
      }
    }
    next(error);
  }
};

/**
 * @desc    Get PWA installation metrics for Admin Dashboard
 * @route   GET /api/analytics/installations OR GET /api/admin/analytics/installations
 * @access  Private (Admin only)
 */
export const getInstallationAnalytics = async (req, res, next) => {
  try {
    const totalInstalls = await Installation.countDocuments();

    // Platform breakdown stats
    const breakdown = {
      android: await Installation.countDocuments({ platform: 'android' }),
      ios: await Installation.countDocuments({ platform: 'ios' }),
      mobile: await Installation.countDocuments({ platform: 'mobile' }),
      desktop: await Installation.countDocuments({ platform: 'desktop' }),
      unknown: await Installation.countDocuments({ platform: 'unknown' }),
    };

    return res.status(200).json({
      success: true,
      totalInstalls,
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};
