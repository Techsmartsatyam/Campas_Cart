import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShoppingBag, LogOut, User as UserIcon, Menu, X, Bell, Check, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!notifDropdownOpen) {
      fetchNotifications();
    }
    setNotifDropdownOpen(!notifDropdownOpen);
  };

  const handleNotificationClick = async (notif) => {
    setNotifDropdownOpen(false);
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.relatedOrder) {
      const orderId = typeof notif.relatedOrder === 'object' ? notif.relatedOrder._id : notif.relatedOrder;
      navigate(`/orders/${orderId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT':
        return '/student';
      case 'SHOPKEEPER':
        return '/shopkeeper';
      case 'DELIVERY_BOY':
        return '/delivery';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: '#ffffff',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '4.5rem',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '1.35rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                background: 'var(--primary-gradient)',
                padding: '0.4rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
            </div>
            <span>
              Campus<span style={{ color: 'var(--primary)' }}>Cart</span>
            </span>
            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.15rem 0.45rem', borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
              🇮🇳 IN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
            className="desktop-nav"
          >
            <Link to="/" style={{ color: 'var(--text-secondary)' }}>
              Home
            </Link>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)' }}>
              How It Works
            </a>
            <a href="#features" style={{ color: 'var(--text-secondary)' }}>
              Features
            </a>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/orders"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/cart"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--text-primary)',
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                      }}
                    >
                      <ShoppingBag style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
                      <span>Cart</span>
                    </Link>
                  </>
                )}

                {/* Notification Bell Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={toggleDropdown}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '0.5rem',
                      padding: '0.45rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                    title="Notifications"
                  >
                    <Bell style={{ width: '1.1rem', height: '1.1rem' }} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-0.3rem',
                          right: '-0.3rem',
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          borderRadius: '9999px',
                          padding: '0.1rem 0.35rem',
                          minWidth: '1.1rem',
                          textAlign: 'center',
                          lineHeight: '1',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '2.5rem',
                        width: '320px',
                        background: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.75rem',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                        zIndex: 200,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8fafc',
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Check size={12} /> Mark all read
                          </button>
                        )}
                      </div>

                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {recentNotifications.length === 0 ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No notifications yet
                          </div>
                        ) : (
                          recentNotifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              style={{
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--border-color)',
                                background: n.isRead ? 'transparent' : '#f0f9ff',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: n.isRead ? '600' : '700', color: 'var(--text-primary)' }}>
                                  {n.title}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <Link
                        to="/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.65rem',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--primary)',
                          fontWeight: '600',
                          borderTop: '1px solid var(--border-color)',
                          textDecoration: 'none',
                          background: '#f8fafc',
                        }}
                      >
                        <span>View all notifications</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to={getDashboardPath()}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon style={{ width: '0.9rem', height: '0.9rem' }} />
                  )}
                  <span>{user.name.split(' ')[0]} ({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                >
                  <LogOut style={{ width: '0.9rem', height: '0.9rem' }} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                <Link to="/login" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 1.5rem 1.5rem 1.5rem',
              background: '#ffffff',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
              Home
            </Link>
            {isAuthenticated ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
                      My Orders
                    </Link>
                    <Link to="/cart" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
                      Cart
                    </Link>
                  </>
                )}
                <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--primary)', fontWeight: '700' }}>
                  Dashboard ({user.role})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--primary)' }}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Responsive Inline CSS overrides */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>

      {/* Main Outlet */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          background: '#ffffff',
          padding: '3rem 0 2rem 0',
          marginTop: 'auto',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>CampusCart</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Your Campus. Your Shops. Your Delivery. Connecting college students with nearby shops for fast delivery.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Platform</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <li><Link to="/student">Student Hub</Link></li>
                <li><Link to="/shopkeeper">Shop Partner</Link></li>
                <li><Link to="/delivery">Delivery Partner</Link></li>
                <li><Link to="/admin">Admin Governance</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Legal</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Campus Guidelines</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <p>© {new Date().getFullYear()} CampusCart Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
