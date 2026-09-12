import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { registerPwaInstallation } from '../utils/pwaInstallTracker';

/**
 * PwaInstallBanner Component
 * Non-intrusive prompt banner appearing when NearCart is installable on supported browsers.
 * Listens for real 'beforeinstallprompt' event and respects user dismissal per session.
 */
export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check standalone / installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check session dismissal preference
    const isDismissed = sessionStorage.getItem('nearcart_pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Listen for native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
      console.log('💡 [PWA Banner] beforeinstallprompt event captured');
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('🎉 [PWA Banner] App installed successfully');
      setIsVisible(false);
      setDeferredPrompt(null);
      registerPwaInstallation();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`[PWA Banner] User response to install prompt: ${choiceResult.outcome}`);
      setIsVisible(false);
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('⚠️ [PWA Banner] Prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('nearcart_pwa_banner_dismissed', 'true');
  };

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 2rem)',
        maxWidth: '480px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        animation: 'slideUpBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.6rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          }}
        >
          <Smartphone style={{ width: '1.3rem', height: '1.3rem', color: '#ffffff' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Install NearCart App</span>
            <Sparkles style={{ width: '0.85rem', height: '0.85rem', color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Fast access & instant order push updates on your device.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Download style={{ width: '0.85rem', height: '0.85rem' }} />
          <span>Install</span>
        </button>

        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            padding: '0.4rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.4rem',
          }}
          title="Dismiss prompt"
        >
          <X style={{ width: '1.1rem', height: '1.1rem' }} />
        </button>
      </div>

      <style>{`
        @keyframes slideUpBanner {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
