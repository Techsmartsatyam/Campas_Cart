import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Phone, Calendar } from 'lucide-react';

export default function RolePlaceholder({ roleTitle, description }) {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: 'var(--primary)',
            }}
          >
            <User size={28} />
          </div>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.25rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
              }}
            >
              AUTHENTICATED PORTAL
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {roleTitle} Dashboard
            </h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          {description}
        </p>

        {user && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Signed In As</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Email</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.email}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Role</span>
              <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{user.role}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Account Status</span>
              <strong style={{ color: 'var(--success)', fontSize: '0.95rem' }}>{user.accountStatus}</strong>
            </div>
          </div>
        )}

        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px dashed var(--border-glow)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            color: 'var(--primary)',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          Phase 3 Authentication Verified — Role Dashboard modules will be developed in future phases.
        </div>
      </div>
    </div>
  );
}
