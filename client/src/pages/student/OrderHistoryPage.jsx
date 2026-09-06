import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Package, Clock, ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res && res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: 'var(--success)' };
      case 'CANCELLED':
      case 'SHOP_REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: 'var(--danger)' };
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', border: 'var(--primary)' };
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link to="/student" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
            <ArrowLeft size={16} /> Back to Student Hub
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            My Orders
          </h1>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: '#f87171', padding: '0.85rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface-hover)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--text-muted)' }}>
            <Package size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No orders found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            You haven't placed any orders yet.
          </p>
          <Link to="/student" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
            Browse Campus Shops
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const badgeStyle = getStatusBadgeClass(order.orderStatus);
            const shop = order.shop || {};
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order._id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </span>
                      <span style={{
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '1rem',
                      }}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> {orderDate} • Shop: <strong style={{ color: 'var(--text-secondary)' }}>{shop.name || 'Shop'}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {order.paymentMethod} ({order.paymentStatus})
                    </div>
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>

                  {order.items && order.items.map((item, idx) => (
                    <span key={idx}>
                      {item.quantity}x {item.name}{idx < order.items.length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <Link
                    to={`/orders/${order._id}`}
                    style={{
                      color: 'var(--primary)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    View Full Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
