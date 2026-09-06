import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app = null;
let messaging = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  }
} catch (err) {
  console.warn('⚠️ Firebase App initialization notice:', err.message);
}

/**
 * Register FCM device token with CampusCart backend
 */
export const requestAndRegisterFCMToken = async (apiInstance) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return null;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.log('FCM messaging is not supported in this browser environment');
      return null;
    }

    if (!app) {
      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
      } else {
        console.log('⚠️ Firebase Web config environment variables not set');
        return null;
      }
    }

    if (!messaging) {
      messaging = getMessaging(app);
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Notification permission status:', permission);
      return null;
    }

    const swRegistration = await navigator.serviceWorker.ready;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    }).catch((err) => {
      console.warn('FCM getToken notice:', err.message);
      return null;
    });

    if (token && apiInstance) {
      await apiInstance.post('/notifications/device-token', {
        token,
        platform: 'web',
      }).catch((err) => {
        console.warn('Backend device-token registration notice:', err.message);
      });
      console.log('📱 FCM Device Token registered successfully');
      return token;
    }

    return token;
  } catch (error) {
    console.warn('FCM Token registration error:', error.message);
    return null;
  }
};

/**
 * Foreground FCM Message Listener
 */
export const setupForegroundFCMListener = async (onForegroundMessage) => {
  try {
    const supported = await isSupported().catch(() => false);
    if (!supported || !app) return null;
    if (!messaging) messaging = getMessaging(app);

    return onMessage(messaging, (payload) => {
      console.log('🔔 Foreground FCM notification received:', payload);
      if (typeof onForegroundMessage === 'function') {
        onForegroundMessage(payload);
      }
    });
  } catch (err) {
    console.warn('Foreground FCM listener setup notice:', err.message);
    return null;
  }
};
