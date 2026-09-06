import React from 'react';
import { MapPin, ShoppingBag } from 'lucide-react';

/**
 * NearCart Professional Logo Component
 * Design Concept: Modern location pin integrated with shopping cart / bag icon
 */
export default function NearCartLogo({ size = 'medium', showText = true, textColor = 'var(--text-primary)' }) {
  const dimensions = {
    small: { iconBg: '1.8rem', iconSize: 14, fontSize: '1.1rem', badge: '0.7rem' },
    medium: { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem' },
    large: { iconBg: '2.8rem', iconSize: 24, fontSize: '1.75rem', badge: '0.85rem' },
  }[size] || { iconBg: '2.2rem', iconSize: 18, fontSize: '1.35rem', badge: '0.75rem' };

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
            color: textColor,
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
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
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
