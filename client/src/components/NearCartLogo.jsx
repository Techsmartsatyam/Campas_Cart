import React from 'react';
import { MapPin, ShoppingBag } from 'lucide-react';

/**
 * NearCart Professional Logo Component
 * Design Concept: Modern location pin integrated with shopping cart / bag icon
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {boolean} showText - Whether to show the text portion
 * @param {string} textColor - Custom text color override (used when variant is not set)
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export default function NearCartLogo({ size = 'medium', showText = true, textColor, variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.8rem', iconSize: 14, fontSize: '1.1rem', badge: '0.7rem' },
    medium: { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem' },
    large: { iconBg: '2.8rem', iconSize: 24, fontSize: '1.75rem', badge: '0.85rem' },
  }[size] || { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem' };

  // Determine text colors based on variant
  const isDark = variant === 'dark';
  const nearColor = textColor || (isDark ? '#ffffff' : 'var(--text-primary)');
  const cartGradient = isDark
    ? 'linear-gradient(135deg, #38bdf8 0%, #a5f3fc 100%)'
    : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
      {/* Icon Mark: Location Pin frame with embedded Shopping Bag */}
      <div
        style={{
          width: dimensions.iconBg,
          height: dimensions.iconBg,
          borderRadius: '0.6rem',
          background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <MapPin style={{ width: '80%', height: '80%', color: 'rgba(255, 255, 255, 0.35)', position: 'absolute' }} />
        <ShoppingBag style={{ width: dimensions.iconSize, height: dimensions.iconSize, color: '#ffffff', position: 'relative', zIndex: 2 }} />
      </div>

      {showText && (
        <span
          style={{
            fontSize: dimensions.fontSize,
            fontWeight: '800',
            color: nearColor,
            letterSpacing: '-0.03em',
            fontFamily: "'Inter', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>Near</span>
          <span
            style={{
              background: cartGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cart
          </span>
        </span>
      )}
    </div>
  );
}
