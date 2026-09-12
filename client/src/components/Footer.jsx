import React from 'react';
import { Link } from 'react-router-dom';
import NearCartLogo from './NearCartLogo';
import {
  ShieldCheck,
  Lock,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Twitter,
  ExternalLink,
  Heart,
} from 'lucide-react';

/**
 * Centralized Social Links Configuration
 * Populate valid URLs to display official social media buttons with hover tooltips and accessibility labels.
 * Unconfigured / empty URLs are safely omitted to avoid fake/broken external links.
 */
export const SOCIAL_LINKS_CONFIG = [
  {
    id: 'instagram',
    name: 'Instagram',
    url: import.meta.env.VITE_SOCIAL_INSTAGRAM || '',
    icon: Instagram,
    ariaLabel: 'NearCart on Instagram',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: import.meta.env.VITE_SOCIAL_LINKEDIN || '',
    icon: Linkedin,
    ariaLabel: 'NearCart on LinkedIn',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: import.meta.env.VITE_SOCIAL_GITHUB || '',
    icon: Github,
    ariaLabel: 'NearCart on GitHub',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: import.meta.env.VITE_SOCIAL_YOUTUBE || '',
    icon: Youtube,
    ariaLabel: 'NearCart on YouTube',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    url: import.meta.env.VITE_SOCIAL_TWITTER || '',
    icon: Twitter,
    ariaLabel: 'NearCart on X (Twitter)',
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Filter only configured social links with valid URLs
  const activeSocialLinks = SOCIAL_LINKS_CONFIG.filter(
    (item) => item.url && typeof item.url === 'string' && item.url.trim() !== ''
  );

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #041d14 0%, #02120d 100%)',
        color: '#f8fafc',
        borderTop: '1px solid rgba(52, 211, 153, 0.15)',
        position: 'relative',
        marginTop: 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Top Emerald Gradient Accent Line */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #10b981 0%, #0284c7 50%, #34d399 100%)',
        }}
      />

      <div
        className="container"
        style={{
          padding: '3.5rem 1.5rem 2rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Column 1: Brand & Tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <NearCartLogo size="medium" />
            </div>

            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#34d399', margin: '0 0 0.5rem 0' }}>
              "Your nearby shops, delivered."
            </p>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>
              NearCart connects customers with nearby local shops for fast, convenient, and reliable ordering & delivery straight to your doorstep.
            </p>

            {/* Social Links Section */}
            {activeSocialLinks.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                  Connect With Us
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {activeSocialLinks.map((social) => {
                    const IconComp = social.icon;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.ariaLabel}
                        title={social.name}
                        className="social-icon-btn"
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(52, 211, 153, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#e2e8f0',
                          textDecoration: 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <IconComp size={16} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/student" className="footer-link">
                  Customer Marketplace
                </Link>
              </li>
              <li>
                <Link to="/orders" className="footer-link">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/cart" className="footer-link">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="footer-link">
                  Notifications
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">
                  About NearCart
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Portals */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
              Platform Portals
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li>
                <Link to="/student" className="footer-link">
                  Customer Marketplace
                </Link>
              </li>
              <li>
                <Link to="/shopkeeper" className="footer-link">
                  Shop Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="footer-link">
                  Delivery Partner Hub
                </Link>
              </li>
              <li>
                <Link to="/admin" className="footer-link">
                  Admin Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Privacy & Safety Trust Section */}
          <div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                borderRadius: '0.85rem',
                padding: '1.25rem',
              }}
            >
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  color: '#34d399',
                  margin: '0 0 0.75rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={18} style={{ color: '#34d399' }} />
                Privacy & Safety
              </h4>

              <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 0.6rem 0' }}>
                Your privacy matters to us. NearCart only uses the information required to provide and manage your orders.
              </p>

              <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 0.6rem 0' }}>
                Account protection: Secure authentication helps protect your account access.
              </p>

              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '0.75rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Lock size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>Do not share passwords or sensitive details with anyone.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.5rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.825rem',
            color: '#64748b',
          }}
        >
          <div>
            © {currentYear} NearCart. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
            <ShieldCheck size={14} style={{ color: '#34d399' }} />
            <span>Secure & Private Local Ordering</span>
          </div>
        </div>
      </div>

      {/* Footer Scoped Hover & Animation Styles */}
      <style>{`
        .footer-link {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }
        .footer-link:hover, .footer-link:focus-visible {
          color: #34d399 !important;
          transform: translateX(3px);
          outline: none;
        }
        .social-icon-btn:hover, .social-icon-btn:focus-visible {
          background: #10b981 !important;
          color: #ffffff !important;
          border-color: #34d399 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          outline: none;
        }
      `}</style>
    </footer>
  );
}
