import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import newLogo from '../assets/newLogo.jpeg';

/**
 * NearCart Professional Logo Component
 * Uses official NearCart logo image with supporting food/dish icon
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {boolean} showText - Whether to show the text portion
 * @param {string} textColor - Custom text color override (used when variant is not set)
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export default function NearCartLogo({ size = 'medium', showText = true, textColor, variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.8rem', iconSize: 14, fontSize: '1.1rem', badge: '0.7rem', foodIconSize: 13 },
    medium: { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem', foodIconSize: 16 },
    large: { iconBg: '2.8rem', iconSize: 24, fontSize: '1.75rem', badge: '0.85rem', foodIconSize: 20 },
  }[size] || { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem', foodIconSize: 16 };

  // Determine text colors based on variant
  const isDark = variant === 'dark';
  const nearColor = textColor || (isDark ? '#ffffff' : 'var(--text-primary)');
  const cartGradient = isDark
    ? 'linear-gradient(135deg, #38bdf8 0%, #a5f3fc 100%)'
    : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', userSelect: 'none' }}>
      {/* Official NearCart Logo Image */}
      <img
        src={newLogo}
        alt="NearCart Logo"
        style={{
          width: dimensions.iconBg,
          height: dimensions.iconBg,
          borderRadius: '0.6rem',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />

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

      {/* Small Supporting Food/Dish Icon */}
      <UtensilsCrossed
        size={dimensions.foodIconSize}
        style={{
          color: isDark ? '#38bdf8' : 'var(--primary, #0284c7)',
          opacity: 0.9,
          flexShrink: 0,
          marginLeft: '0.1rem',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
