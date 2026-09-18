import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import newLogo from '../assets/newLogo.jpeg';

/**
 * NearCart Primary Logo Component (LEFT SIDE)
 * Renders [NearCart Logo Image] + NearCart Text
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {boolean} showText - Whether to show the text portion
 * @param {string} textColor - Custom text color override (used when variant is not set)
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export default function NearCartLogo({ size = 'medium', showText = true, textColor, variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.8rem', fontSize: '1.1rem' },
    medium: { iconBg: '2.2rem', fontSize: '1.35rem' },
    large: { iconBg: '2.8rem', fontSize: '1.75rem' },
  }[size] || { iconBg: '2.2rem', fontSize: '1.35rem' };

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
    </div>
  );
}

/**
 * Food Disk Secondary Branding Component (RIGHT CORNER)
 * Renders [Food/Utensils Icon Logo] + Food Disk Text
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export function FoodDiskBrand({ size = 'medium', variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.35rem', iconSize: 11, fontSize: '0.75rem' },
    medium: { iconBg: '1.65rem', iconSize: 13, fontSize: '0.875rem' },
    large: { iconBg: '2.0rem', iconSize: 15, fontSize: '1.05rem' },
  }[size] || { iconBg: '1.65rem', iconSize: 13, fontSize: '0.875rem' };

  const isDark = variant === 'dark';
  const textColor = isDark ? '#38bdf8' : 'var(--primary, #0284c7)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        userSelect: 'none',
        padding: '0.25rem 0.6rem',
        borderRadius: '0.45rem',
        background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd'}`,
        flexShrink: 0,
      }}
    >
      {/* Food / Dish Logo Icon */}
      <div
        style={{
          width: dimensions.iconBg,
          height: dimensions.iconBg,
          borderRadius: '0.35rem',
          background: '#0284c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <UtensilsCrossed size={dimensions.iconSize} style={{ color: '#ffffff' }} aria-hidden="true" />
      </div>

      {/* Food Disk Text */}
      <span
        style={{
          fontSize: dimensions.fontSize,
          fontWeight: '700',
          color: textColor,
          letterSpacing: '-0.01em',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        Food Disk
      </span>
    </div>
  );
}
