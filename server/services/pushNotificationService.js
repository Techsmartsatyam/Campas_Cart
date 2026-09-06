import admin from 'firebase-admin';
import User from '../models/User.js';

let isFirebaseAdminInitialized = false;

// Safe Firebase Admin Initialization
try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isFirebaseAdminInitialized = true;
      console.log('🔥 [FCM Admin] Initialized with FIREBASE_SERVICE_ACCOUNT');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      isFirebaseAdminInitialized = true;
      console.log('🔥 [FCM Admin] Initialized with explicit environment credentials');
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ [FCM Error] Firebase Admin SDK credentials missing in production environment! Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      } else {
        console.warn('⚠️ [FCM Warning] Firebase Admin credentials not set. Push notifications will operate in dry-run mode.');
      }
    }
  } else {
    isFirebaseAdminInitialized = true;
  }
} catch (err) {
  console.warn('⚠️ [FCM Error] Failed to initialize Firebase Admin SDK:', err.message);
}

/**
 * Remove invalid or unregistered device tokens from user records
 */
export const removeInvalidTokens = async (userId, invalidTokens) => {
  if (!invalidTokens || invalidTokens.length === 0) return;
  try {
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushTokens: { token: { $in: invalidTokens } } },
      });
      console.log(`🧹 [FCM Token Cleanup] Removed ${invalidTokens.length} dead token(s) from user ${userId}`);
    } else {
      await User.updateMany(
        { 'pushTokens.token': { $in: invalidTokens } },
        { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
      );
      console.log(`🧹 [FCM Token Cleanup] Removed ${invalidTokens.length} dead token(s) across database`);
    }
  } catch (err) {
    console.error('Error cleaning up invalid push tokens:', err.message);
  }
};

/**
 * Send push notification to a specific list of FCM tokens
 */
export const sendPushToTokens = async (tokens, payload, userId = null) => {
  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0, failureCount: 0 };
  }
  if (!isFirebaseAdminInitialized) {
    console.warn(`⚠️ [FCM Dry-Run] Firebase Admin not initialized. Skipping push to ${tokens.length} token(s)`);
    return { success: false, message: 'Firebase Admin not configured', sentCount: 0, failureCount: tokens.length };
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { success: true, sentCount: 0, failureCount: 0 };
  }

  const title = payload.title || 'CampusCart Notification';
  const body = payload.body || payload.message || '';
  const orderId = payload.orderId ? String(payload.orderId) : '';
  const type = payload.type || 'ORDER';
  const url = payload.url || '/notifications';

  // Strategy: Send data-only payload to avoid duplicate OS notifications when Service Worker handles push event
  const message = {
    data: {
      title,
      body,
      orderId,
      type,
      url,
      click_action: url,
      ...(payload.data || {}),
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      fcmOptions: {
        link: url,
      },
    },
    tokens: uniqueTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    const invalidTokens = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(uniqueTokens[idx]);
        } else {
          console.warn(`⚠️ [FCM Send Notice] Token push failed index ${idx}:`, error.code || error.message);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await removeInvalidTokens(userId, invalidTokens);
    }

    console.log(`📱 [FCM Multicast] Result: ${response.successCount} succeeded, ${response.failureCount} failed out of ${uniqueTokens.length} token(s)`);
    return {
      success: response.successCount > 0,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err) {
    console.error('❌ [FCM Multicast Error]:', err.message);
    return { success: false, error: err.message, sentCount: 0, failureCount: uniqueTokens.length };
  }
};

/**
 * Send push notification to all active device tokens belonging to a user ID
 */
export const sendPushToUser = async (userId, payload) => {
  try {
    if (!userId) return { success: true, sentCount: 0, failureCount: 0 };
    const user = await User.findById(userId).select('pushTokens');
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return { success: true, sentCount: 0, failureCount: 0 };
    }

    const activeTokens = user.pushTokens
      .filter((t) => t.isActive !== false && t.token)
      .map((t) => t.token);

    if (activeTokens.length > 0) {
      return await sendPushToTokens(activeTokens, payload, user._id);
    }
    return { success: true, sentCount: 0, failureCount: 0 };
  } catch (err) {
    console.error(`Failed to send push to user ${userId}:`, err.message);
    return { success: false, error: err.message, sentCount: 0, failureCount: 0 };
  }
};

