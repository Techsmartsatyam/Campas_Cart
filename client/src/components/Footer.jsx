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
          padding: '1.5rem 1.25rem 1.25rem 1.25rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Column 1: Brand & Tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <NearCartLogo size="small" variant="dark" />
            </div>

            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399', margin: '0 0 0.35rem 0' }}>
              "Your nearby shops, delivered."
            </p>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 0.75rem 0' }}>
              NearCart connects customers with nearby local shops for fast, convenient, and reliable ordering & delivery straight to your doorstep.
            </p>

            {/* Social Links Section */}
            {activeSocialLinks.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                  Connect With Us
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                          width: '1.85rem',
                          height: '1.85rem',
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
                        <IconComp size={14} />
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
                fontSize: '0.85rem',
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
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
                fontSize: '0.85rem',
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
              Platform Portals
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
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
                borderRadius: '0.65rem',
                padding: '0.85rem 1rem',
              }}
            >
              <h4
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: '#34d399',
                  margin: '0 0 0.4rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <ShieldCheck size={15} style={{ color: '#34d399' }} />
                Privacy & Safety
              </h4>

              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.35', margin: '0 0 0.4rem 0' }}>
                Your privacy matters to us. NearCart only uses data needed to process your orders.
              </p>

              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  marginTop: '0.4rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Lock size={12} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>Secure account protection enabled.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '0.85rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div>
            © {currentYear} NearCart. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
            <ShieldCheck size={13} style={{ color: '#34d399' }} />
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
