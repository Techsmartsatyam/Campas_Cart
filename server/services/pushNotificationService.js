import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Ensure environment variables are loaded regardless of ESM import order
dotenv.config();

let isFirebaseAdminInitialized = false;

const initializeFirebaseAdmin = () => {
  if (isFirebaseAdminInitialized && getApps().length > 0) {
    return true;
  }

  console.log('[FCM Admin] Initializing Firebase Admin');

  try {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let serviceAccount;
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
          serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        }
        initializeApp({
          credential: cert(serviceAccount),
        });
        isFirebaseAdminInitialized = true;
        console.log('[FCM Admin] Firebase Admin initialized successfully');
      } else {
        const missingVars = [];
        if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
        if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
        if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');

        if (missingVars.length > 0) {
          missingVars.forEach((vName) => {
            console.error(`❌ [FCM Error] Missing environment variable: ${vName}`);
          });
        } else {
          const formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: formattedPrivateKey,
            }),
          });
          isFirebaseAdminInitialized = true;
          console.log('[FCM Admin] Firebase Admin initialized successfully');
        }
      }
    } else {
      isFirebaseAdminInitialized = true;
      console.log('[FCM Admin] Firebase Admin initialized successfully');
    }
  } catch (err) {
    console.error('⚠️ [FCM Error] Failed to initialize Firebase Admin SDK:', err.message);
  }

  return isFirebaseAdminInitialized;
};

// Immediate module initialization attempt
initializeFirebaseAdmin();

export const getFirebaseAdminStatus = () => {
  initializeFirebaseAdmin();
  return isFirebaseAdminInitialized;
};

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
    console.log('[FCM] Preparing push: 0 tokens target');
    return { success: true, sentCount: 0, failureCount: 0 };
  }

  initializeFirebaseAdmin();

  if (!isFirebaseAdminInitialized) {
    console.warn(`⚠️ [FCM Warning] Firebase Admin not initialized. Skipping push to ${tokens.length} token(s)`);
    return { success: false, message: 'Firebase Admin not configured', sentCount: 0, failureCount: tokens.length };
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { success: true, sentCount: 0, failureCount: 0 };
  }

  console.log(`[FCM] Preparing push. Target tokens: ${uniqueTokens.length}`);

  const title = payload.title || 'CampusCart Notification';
  const body = payload.body || payload.message || '';
  const orderId = payload.orderId ? String(payload.orderId) : '';
  const type = payload.type || 'ORDER';
  const url = payload.url || '/notifications';

  // Strategy: Send data-only payload so Service Worker receives push event and executes showNotification
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
    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);
    const invalidTokens = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (
          error &&
          (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered')
        ) {
          invalidTokens.push(uniqueTokens[idx]);
        } else if (error) {
          console.warn(`⚠️ [FCM Send Notice] Token push failed index ${idx}:`, error.code || error.message);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await removeInvalidTokens(userId, invalidTokens);
    }

    console.log(`[FCM] Firebase send success: ${response.successCount}`);
    console.log(`[FCM] Firebase send failure: ${response.failureCount}`);
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
