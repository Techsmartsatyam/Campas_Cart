import api from '../services/api';

const INSTALL_ID_KEY = 'nearcart_install_id';

/**
 * Get or generate persistent unique anonymous installation ID for this client/device
 */
export function getOrCreateInstallId() {
  try {
    let installId = localStorage.getItem(INSTALL_ID_KEY);
    if (!installId) {
      const rand1 = Math.random().toString(36).substring(2, 10);
      const rand2 = Math.random().toString(36).substring(2, 8);
      installId = `inst_${Date.now()}_${rand1}${rand2}`;
      localStorage.setItem(INSTALL_ID_KEY, installId);
    }
    return installId;
  } catch (e) {
    // Fallback if localStorage is restricted
    return `inst_${Date.now()}_temp`;
  }
}

/**
 * Detect client device platform
 */
export function detectPlatform() {
  if (typeof window === 'undefined' || !window.navigator) return 'unknown';

  const ua = window.navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Register unique PWA installation with backend API
 */
export async function registerPwaInstallation(customPlatform) {
  try {
    const installationId = getOrCreateInstallId();
    const platform = customPlatform || detectPlatform();

    const res = await api.post('/analytics/install', {
      installationId,
      platform,
    });

    if (res && res.success) {
      console.log('📱 [PWA Tracker] Installation registered/synced:', res.installationId, 'isNew:', res.isNew);
    }
    return res;
  } catch (err) {
    console.warn('⚠️ [PWA Tracker] Registration sync failed:', err.message || err);
    return null;
  }
}
