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
      console.log('🔥 Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      isFirebaseAdminInitialized = true;
      console.log('🔥 Firebase Admin initialized with explicit environment credentials');
    } else {
      console.warn('⚠️ Firebase Admin credentials not set. FCM Push Notifications will operate in dry-run mode.');
    }
  } else {
    isFirebaseAdminInitialized = true;
  }
} catch (err) {
  console.warn('⚠️ Failed to initialize Firebase Admin SDK:', err.message);
}

/**
 * Remove invalid or unregistered device tokens from user record
 */
export const removeInvalidTokens = async (userId, invalidTokens) => {
  if (!userId || !invalidTokens || invalidTokens.length === 0) return;
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushTokens: { token: { $in: invalidTokens } } },
    });
    console.log(`🧹 Cleaned up ${invalidTokens.length} invalid push token(s) for user ${userId}`);
  } catch (err) {
    console.error('Error cleaning up invalid push tokens:', err.message);
  }
};

/**
 * Send push notification to a specific list of FCM tokens
 */
export const sendPushToTokens = async (tokens, payload, userId = null) => {
  if (!tokens || tokens.length === 0) return { success: true, sentCount: 0 };
  if (!isFirebaseAdminInitialized) {
    console.log(`[FCM Dry-Run] Would send push to ${tokens.length} token(s):`, payload.title || payload.notification?.title);
    return { success: false, message: 'Firebase Admin not configured' };
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) return { success: true, sentCount: 0 };

  const message = {
    notification: {
      title: payload.title || 'CampusCart Notification',
      body: payload.body || payload.message || '',
    },
    data: {
      orderId: payload.orderId ? String(payload.orderId) : '',
      type: payload.type || 'ORDER',
      click_action: payload.url || '/notifications',
      ...payload.data,
    },
    webpush: {
      notification: {
        title: payload.title || 'CampusCart Notification',
        body: payload.body || payload.message || '',
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        click_action: payload.url || '/notifications',
      },
      fcmOptions: {
        link: payload.url || '/notifications',
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
          console.warn(`FCM token push error (${uniqueTokens[idx]}):`, error.message);
        }
      }
    });

    if (invalidTokens.length > 0 && userId) {
      await removeInvalidTokens(userId, invalidTokens);
    }

    console.log(`📱 FCM Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${uniqueTokens.length}`);
    return {
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err) {
    console.error('FCM sendEachForMulticast error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send push notification to all active device tokens belonging to a user ID
 */
export const sendPushToUser = async (userId, payload) => {
  try {
    if (!userId) return;
    const user = await User.findById(userId).select('pushTokens');
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return;
    }

    const activeTokens = user.pushTokens
      .filter((t) => t.isActive !== false && t.token)
      .map((t) => t.token);

    if (activeTokens.length > 0) {
      await sendPushToTokens(activeTokens, payload, user._id);
    }
  } catch (err) {
    console.error(`Failed to send push to user ${userId}:`, err.message);
  }
};
