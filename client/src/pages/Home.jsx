import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth } from '../services/api';
import {
  ShoppingBag,
  Store,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Shield,
  Search,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState({ loading: true, success: false, message: '' });

  useEffect(() => {
    async function verifyBackend() {
      const result = await checkHealth();
      setApiStatus({
        loading: false,
        success: result.success,
        message: result.message,
      });
    }
    verifyBackend();
  }, []);

  const features = [
    {
      title: 'Nearby Shops',
      desc: 'Access your favorite campus canteens, stationery stores, and grocery stalls instantly.',
      icon: Store,
    },
    {
      title: 'Easy Ordering',
      desc: 'Browse categorized products and place quick orders straight to your hostel room.',
      icon: Search,
    },
    {
      title: 'Fast Campus Delivery',
      desc: 'Hyperlocal delivery runners who know every corner and block of your campus.',
      icon: Zap,
    },
    {
      title: 'Secure Payments',
      desc: 'Multiple convenient payment options including COD and online payments.',
      icon: Shield,
    },
    {
      title: 'Order Tracking',
      desc: 'Real-time updates on your order lifecycle from store acceptance to dropoff.',
      icon: Clock,
    },
    {
      title: 'Student Friendly',
      desc: 'Designed specifically for affordable, low-cost delivery within campus grounds.',
      icon: ShoppingBag,
    },
  ];

  const steps = [
    { step: '01', title: 'Browse', desc: 'Find local campus stores and explore everyday essentials.' },
    { step: '02', title: 'Order', desc: 'Select items and place your order in seconds.' },
    { step: '03', title: 'Receive', desc: 'Get doorstep delivery right at your hostel block.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{ padding: '5rem 0 4rem 0', textAlign: 'center', position: 'relative' }}>
        <div className="container">
          {/* Status badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(16, 28, 46, 0.8)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              marginBottom: '2rem',
            }}
          >
            {apiStatus.loading ? (
              <span style={{ color: 'var(--text-muted)' }}>Connecting to CampusCart network...</span>
            ) : apiStatus.success ? (
              <>
                <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem', color: 'var(--success)' }} />
                <span style={{ color: 'var(--success)', fontWeight: '500' }}>{apiStatus.message}</span>
              </>
            ) : (
              <>
                <AlertCircle style={{ width: '0.9rem', height: '0.9rem', color: 'var(--danger)' }} />
                <span style={{ color: 'var(--danger)', fontWeight: '500' }}>API Offline (Run Backend Server)</span>
              </>
            )}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              maxWidth: '850px',
              margin: '0 auto 1.25rem auto',
            }}
          >
            Everything You Need.{' '}
            <span
              style={{
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Right Around Campus.
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              margin: '0 auto 2.5rem auto',
              fontWeight: '400',
            }}
          >
            CampusCart connects students with nearby local shops for fast, convenient, and reliable campus delivery.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/register" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Start Shopping <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Partner Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Built for the Entire Campus</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Tailored portals for every member of the campus ecosystem.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card">
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShoppingBag style={{ color: 'var(--primary)' }} size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.4rem' }}>Student</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Order snacks, food, stationery, and daily items directly to your hostel block.
              </p>
              <Link to="/student" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '600' }}>
                Access Portal →
              </Link>
            </div>

            <div className="glass-card">
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Store style={{ color: 'var(--success)' }} size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.4rem' }}>Shopkeeper</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Manage catalog, process instant incoming orders, and increase campus sales.
              </p>
              <Link to="/shopkeeper" style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: '600' }}>
                Access Portal →
              </Link>
            </div>

            <div className="glass-card">
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Truck style={{ color: 'var(--warning)' }} size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.4rem' }}>Delivery Partner</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Earn on campus by completing localized orders within flexible hours.
              </p>
              <Link to="/delivery" style={{ color: 'var(--warning)', fontSize: '0.875rem', fontWeight: '600' }}>
                Access Portal →
              </Link>
            </div>

            <div className="glass-card">
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.5rem', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShieldCheck style={{ color: '#a855f7' }} size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.4rem' }}>Admin</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Onboard store vendors, verify delivery staff, and oversee platform health.
              </p>
              <Link to="/admin" style={{ color: '#a855f7', fontSize: '0.875rem', fontWeight: '600' }}>
                Access Portal →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '4rem 0', background: 'rgba(7, 17, 31, 0.4)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>How CampusCart Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Simple, streamlined three-step delivery experience.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {steps.map((s) => (
              <div key={s.step} className="glass-card" style={{ textAlign: 'center', position: 'relative' }}>
                <span
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: 'var(--primary)',
                    opacity: 0.25,
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  {s.step}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Platform Features</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Engineered specifically for university & campus communities.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {features.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.title} className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', flexShrink: 0 }}>
                    <IconComp size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{f.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
