import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck,
  UserPlus,
  Users,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('STAFF_CREATE');

  // Staff Creation Form State
  const [staffTab, setStaffTab] = useState('SHOPKEEPER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User Management Directory State
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Payment Management State
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      if (res.success && res.users) {
        setUsersList(res.users);
      }
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get('/payments');
      if (res.success) {
        setPaymentsList(res.data || []);
        setPaymentStats(res.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch payment management data:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPayments();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/auth/admin/create-staff', {
        ...formData,
        role: staffTab,
      });

      if (res.success) {
        setSuccess(`${staffTab === 'SHOPKEEPER' ? 'Shopkeeper' : 'Delivery Partner'} account created successfully!`);
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchUsers();
      } else {
        setError(res.message || 'Failed to create staff account.');
      }
    } catch (err) {
      setError(err.message || 'User with this email already exists or creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlockUser = async (userId, currentActiveStatus, userName) => {
    const nextStatus = !currentActiveStatus;
    const actionText = nextStatus ? 'unblock' : 'block';

    if (!window.confirm(`Are you sure you want to ${actionText} ${userName}?`)) return;

    setError('');
    setSuccess('');

    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { isActive: nextStatus });
      if (res.success) {
        setSuccess(res.message);
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || `Failed to ${actionText} user.`);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter === 'ALL') return true;
    return u.role === userRoleFilter;
  });

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '0.75rem',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Admin Governance Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Onboard staff members and manage user access control across CampusCart.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} /> <span>{success}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('STAFF_CREATE')}
          className={activeTab === 'STAFF_CREATE' ? 'btn-primary' : 'btn-secondary'}
        >
          <UserPlus size={18} /> Staff Onboarding
        </button>
        <button
          onClick={() => setActiveTab('USER_MANAGEMENT')}
          className={activeTab === 'USER_MANAGEMENT' ? 'btn-primary' : 'btn-secondary'}
        >
          <Users size={18} /> User Access & Block Controls
        </button>
        <button
          onClick={() => setActiveTab('PAYMENT_MANAGEMENT')}
          className={activeTab === 'PAYMENT_MANAGEMENT' ? 'btn-primary' : 'btn-secondary'}
        >
          <CreditCard size={18} /> Payment Management
        </button>
      </div>

      {/* SECTION 1: Staff Onboarding */}
      {activeTab === 'STAFF_CREATE' && (
        <div className="glass-card" style={{ maxWidth: '550px', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Create Staff Account
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(7, 17, 31, 0.8)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.75rem' }}>
            <button
              type="button"
              onClick={() => setStaffTab('SHOPKEEPER')}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: staffTab === 'SHOPKEEPER' ? 'var(--primary-gradient)' : 'transparent',
                color: staffTab === 'SHOPKEEPER' ? '#07111f' : 'var(--text-secondary)',
              }}
            >
              Shopkeeper
            </button>
            <button
              type="button"
              onClick={() => setStaffTab('DELIVERY_BOY')}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: staffTab === 'DELIVERY_BOY' ? 'var(--primary-gradient)' : 'transparent',
                color: staffTab === 'DELIVERY_BOY' ? '#07111f' : 'var(--text-secondary)',
              }}
            >
              Delivery Partner
            </button>
          </div>

          <form onSubmit={handleCreateStaff}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder={staffTab === 'SHOPKEEPER' ? 'e.g., Alex Store Owner' : 'e.g., Runner Sam'}
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="staff@campuscart.com"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleFormChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}>
              {submitting ? 'Creating Account...' : `Create ${staffTab === 'SHOPKEEPER' ? 'Shopkeeper' : 'Delivery Partner'}`}
            </button>
          </form>
        </div>
      )}

      {/* SECTION 2: User Access & Block Controls */}
      {activeTab === 'USER_MANAGEMENT' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              User Directory & Access Controls
            </h3>

            {/* Role Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
              {['ALL', 'STUDENT', 'SHOPKEEPER', 'DELIVERY_BOY'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={userRoleFilter === role ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {loadingUsers ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No users found matching filter.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>User</th>
                    <th style={{ padding: '0.75rem' }}>Contact</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Account Status</th>
                    <th style={{ padding: '0.75rem' }}>Access State</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {u.email}<br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.phone}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{u.accountStatus || 'APPROVED'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: u.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: u.isActive ? 'var(--success)' : 'var(--danger)' }}>
                          {u.isActive ? 'ACTIVE' : 'BLOCKED'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleBlockUser(u._id, u.isActive, u.name)}
                            className="btn-secondary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              color: u.isActive ? 'var(--danger)' : 'var(--success)',
                            }}
                          >
                            {u.isActive ? (
                              <>
                                <Lock size={14} /> Block
                              </>
                            ) : (
                              <>
                                <Unlock size={14} /> Unblock
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Payment Management */}
      {activeTab === 'PAYMENT_MANAGEMENT' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Payment Governance & Audit Trail
          </h3>

          {/* Payment Stats Overview */}
          {paymentStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Payments</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{paymentStats.totalPayments}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Successful</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--success)' }}>{paymentStats.successfulPayments}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Failed</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--danger)' }}>{paymentStats.failedPayments}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Pending</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fbbf24' }}>{paymentStats.pendingPayments}</div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Total Revenue</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>₹{paymentStats.totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Payment Records Table */}
          {loadingPayments ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading payment records...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Order</th>
                    <th style={{ padding: '0.75rem' }}>Student</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Method</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Razorpay Order ID</th>
                    <th style={{ padding: '0.75rem' }}>Payment / Txn ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '700' }}>
                        {p.order?.orderNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{p.user?.name || 'User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.user?.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{p.amount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.05)' }}>
                          {p.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: p.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : p.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: p.status === 'SUCCESS' ? 'var(--success)' : p.status === 'FAILED' ? 'var(--danger)' : '#fbbf24',
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {p.providerOrderId || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {p.providerPaymentId || p.transactionId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
