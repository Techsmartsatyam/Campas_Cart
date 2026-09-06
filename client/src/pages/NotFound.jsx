import React from 'react';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '0.5rem' }}>404</h2>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          The page you are looking for does not exist on NearCart.
        </p>
        <a href="/" className="btn-primary">Return to Home</a>
      </div>
    </div>
  );
}
