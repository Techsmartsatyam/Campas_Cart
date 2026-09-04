import React from 'react';

export function SearchBar({ value, onChange, placeholder = 'Search products, shops...' }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          paddingLeft: '2.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 28, 46, 0.9)',
        }}
      />
      <svg
        style={{
          position: 'absolute',
          left: '0.9rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </div>
  );
}

export function CategoryCard({ category, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? 'var(--primary-gradient)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
        color: isSelected ? '#07111f' : 'var(--text-primary)',
        fontWeight: isSelected ? '700' : '500',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
      }}
    >
      <span>{category.name}</span>
    </div>
  );
}

export function ShopCard({ shop, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              background: 'var(--surface-light)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontWeight: '700',
              color: 'var(--primary)',
              fontSize: '1.2rem',
              border: '1px solid var(--border-color)',
            }}
          >
            {shop.name.charAt(0)}
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{shop.name}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shop.category?.name || 'General Store'}</span>
          </div>
        </div>

        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: shop.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: shop.isOpen ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${shop.isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {shop.isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1 }}>
        {shop.description || 'Campus shop providing essential goods.'}
      </p>

      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
        }}
      >
        <span>⭐ {shop.rating?.toFixed(1) || '4.5'} ({shop.totalRatings || 0})</span>
        <span>Delivery: ₹{shop.deliveryFee || 0}</span>
      </div>
    </div>
  );
}

export function ProductCard({ product, onClick }) {
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      {hasDiscount && (
        <span
          style={{
            position: 'absolute',
            top: '0.85rem',
            right: '0.85rem',
            background: 'var(--danger)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.25rem',
          }}
        >
          {discountPercent}% OFF
        </span>
      )}

      <div
        style={{
          width: '100%',
          height: '140px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(7, 17, 31, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          marginBottom: '1rem',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Image</span>
        )}
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>
        {product.shop?.name || 'Campus Store'}
      </span>

      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem 0' }}>
        {product.name}
      </h4>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem', flex: 1 }}>
        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          ₹{hasDiscount ? product.discountPrice : product.price}
        </span>
        {hasDiscount && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
            ₹{product.price}
          </span>
        )}
        {product.unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {product.unit}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: product.stock > 0 ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>

        <button
          className="btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', pointerEvents: 'none' }}
        >
          Details →
        </button>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ message, onReset }) {
  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', margin: '2rem 0' }}>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Items Found</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{message}</p>
      {onReset && (
        <button onClick={onReset} className="btn-secondary">
          Reset Search & Filters
        </button>
      )}
    </div>
  );
}
