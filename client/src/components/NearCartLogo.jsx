import React from 'react';
import { UtensilsCrossed, CookingPot } from 'lucide-react';
import newLogo from '../assets/newLogo.jpeg';

/**
 * NearCart Primary Logo Component (LEFT SIDE)
 * Renders [NearCart Logo Image] + NearCart Text + Restored Two-Fork Food Symbol
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {boolean} showText - Whether to show the text portion
 * @param {string} textColor - Custom text color override (used when variant is not set)
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export default function NearCartLogo({ size = 'medium', showText = true, textColor, variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.8rem', fontSize: '1.1rem', foodIconSize: 13 },
    medium: { iconBg: '2.2rem', fontSize: '1.35rem', foodIconSize: 16 },
    large: { iconBg: '2.8rem', fontSize: '1.75rem', foodIconSize: 20 },
  }[size] || { iconBg: '2.2rem', fontSize: '1.35rem', foodIconSize: 16 };

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

      {/* Restored Small Two-Fork Supporting Food Symbol */}
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

/**
 * Food Disk Secondary Branding Component (RIGHT CORNER)
 * Renders [Food Disk Logo Icon] + Food Disk Text
 * @param {'small'|'medium'|'large'} size - Logo size preset
 * @param {'light'|'dark'} variant - 'light' for white/light backgrounds (default), 'dark' for dark backgrounds
 */
export function FoodDiskBrand({ size = 'medium', variant = 'light' }) {
  const dimensions = {
    small: { iconBg: '1.4rem', iconSize: 11, fontSize: '0.75rem' },
    medium: { iconBg: '1.75rem', iconSize: 14, fontSize: '0.9rem' },
    large: { iconBg: '2.1rem', iconSize: 16, fontSize: '1.05rem' },
  }[size] || { iconBg: '1.75rem', iconSize: 14, fontSize: '0.9rem' };

  const isDark = variant === 'dark';
  const textColor = isDark ? '#ffffff' : 'var(--text-primary)';
  const brandGradient = isDark
    ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)'
    : 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        userSelect: 'none',
        padding: '0.3rem 0.65rem',
        borderRadius: '0.6rem',
        background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd'}`,
        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)',
        flexShrink: 0,
      }}
    >
      {/* Professional Food Disk Logo Icon */}
      <div
        style={{
          width: dimensions.iconBg,
          height: dimensions.iconBg,
          borderRadius: '0.45rem',
          background: brandGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
          flexShrink: 0,
        }}
      >
        <CookingPot size={dimensions.iconSize} style={{ color: '#ffffff' }} aria-hidden="true" />
      </div>

      {/* Food Disk Text */}
      <span
        style={{
          fontSize: dimensions.fontSize,
          fontWeight: '800',
          color: textColor,
          letterSpacing: '-0.02em',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span>Food</span>
        <span
          style={{
            background: brandGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Disk
        </span>
      </span>
    </div>
  );
}
