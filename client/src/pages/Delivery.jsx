import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { Truck, CheckCircle2, Clock, AlertCircle, MapPin, Package, RefreshCw, ArrowRight, DollarSign, Power, Navigation } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Delivery() {
  const { user, updateUser } = useAuth();
  const { socket: globalSocket } = useNotifications();

  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [geoStatus, setGeoStatus] = useState('OFF');

  const socketRef = useRef(null);
  const geoWatchIdRef = useRef(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [availRes, myRes] = await Promise.all([
        api.get('/delivery/available-orders'),
        api.get('/delivery/my-deliveries'),
      ]);

      if (availRes.success && availRes.deliveries) {
        setAvailableDeliveries(availRes.deliveries);
      }

      if (myRes.success && myRes.deliveries) {
        setMyDeliveries(myRes.deliveries);
      }
    } catch (err) {
      setError(err.message || 'Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Listen to real-time delivery events on global socket
  useEffect(() => {
    if (!globalSocket) return;

    const handleNewDeliveryOrder = async (data) => {
      console.log('⚡ [Delivery Realtime] delivery:order:new received:', data);
      try {
        const availRes = await api.get('/delivery/available-orders');
        if (availRes.success && availRes.deliveries) {
          setAvailableDeliveries(availRes.deliveries);
        }
      } catch (err) {
        console.warn('Realtime delivery refresh notice:', err.message);
      }
    };

    const handleDeliveryUpdated = async (data) => {
      console.log('⚡ [Delivery Realtime] order/delivery update received:', data);
      try {
        const [availRes, myRes] = await Promise.all([
          api.get('/delivery/available-orders'),
          api.get('/delivery/my-deliveries'),
        ]);
        if (availRes.success && availRes.deliveries) setAvailableDeliveries(availRes.deliveries);
        if (myRes.success && myRes.deliveries) setMyDeliveries(myRes.deliveries);
      } catch (err) {
        console.warn('Realtime delivery refresh notice:', err.message);
      }
    };

    globalSocket.on('delivery:order:new', handleNewDeliveryOrder);
    globalSocket.on('order:updated', handleDeliveryUpdated);
    globalSocket.on('delivery:status:update', handleDeliveryUpdated);

    return () => {
      globalSocket.off('delivery:order:new', handleNewDeliveryOrder);
      globalSocket.off('order:updated', handleDeliveryUpdated);
      globalSocket.off('delivery:status:update', handleDeliveryUpdated);
    };
  }, [globalSocket]);

  // Active delivery check
  const activeDelivery = myDeliveries.find((d) =>
    ['ASSIGNED', 'ACCEPTED', 'ARRIVED_AT_SHOP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status)
  );

  const isOutForDelivery = activeDelivery?.status === 'OUT_FOR_DELIVERY';
  const activeOrderId = activeDelivery?.order?._id;

  // Socket connection & GPS tracking lifecycle
  useEffect(() => {
    if (isOutForDelivery && activeOrderId && isOnline) {
      // Connect socket
      const socket = io('http://localhost:5000', {
        withCredentials: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected for live GPS sharing');
        socket.emit('delivery:join', { orderId: activeOrderId });
      });

      // Start Geolocation watcher if supported
      if ('geolocation' in navigator) {
        setGeoStatus('CONNECTING');
        let lastSentTime = 0;

        geoWatchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const now = Date.now();
            // Throttle GPS updates to 3 seconds minimum interval
            if (now - lastSentTime > 3000) {
              lastSentTime = now;
              setGeoStatus('LIVE');

              const { latitude, longitude, accuracy } = position.coords;
              socket.emit('delivery:location', {
                orderId: activeOrderId,
                latitude,
                longitude,
                accuracy,
                timestamp: now,
              });
            }
          },
          (geoErr) => {
            console.warn('Geolocation watcher warning:', geoErr.message);
            setGeoStatus('PERMISSION_DENIED');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000,
          }
        );
      } else {
        setGeoStatus('UNSUPPORTED');
      }

      return () => {
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
        if (socketRef.current) {
          socketRef.current.emit('delivery:leave', { orderId: activeOrderId });
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setGeoStatus('OFF');
      };
    } else {
      setGeoStatus('OFF');
    }
  }, [isOutForDelivery, activeOrderId, isOnline]);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const newStatus = !isOnline;
      const res = await api.put('/auth/profile', { isOnline: newStatus });
      if (res.success) {
        setIsOnline(newStatus);
        if (updateUser) updateUser(res.user);
        setSuccess(`Status changed to ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to change online status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptDelivery = async (orderId) => {
    setError('');
    setSuccess('');
    setAcceptingId(orderId);
    try {
      const res = await api.patch(`/delivery/orders/${orderId}/accept`);
      if (res.success) {
        setSuccess('Delivery accepted successfully!');
        fetchAllData();
      }
    } catch (err) {
      if (err.status === 409) {
        setError('Sorry, this order has already been accepted by another delivery partner.');
      } else {
        setError(err.message || 'Failed to accept delivery.');
      }
      fetchAllData();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    setError('');
    setSuccess('');
    setStatusUpdatingId(id);
    try {
      const res = await api.patch(`/delivery/${id}/status`, { status: nextStatus });
      if (res.success) {
        setSuccess(`Delivery updated to ${nextStatus}`);
        fetchAllData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'ASSIGNED':
        return { label: 'ARRIVED AT SHOP', nextState: 'ARRIVED_AT_SHOP' };
      case 'ARRIVED_AT_SHOP':
        return { label: 'CONFIRM PICKUP', nextState: 'PICKED_UP' };
      case 'PICKED_UP':
        return { label: 'OUT FOR DELIVERY', nextState: 'OUT_FOR_DELIVERY' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'MARK DELIVERED', nextState: 'DELIVERED' };
      default:
        return null;
    }
  };

  // Database-backed Earnings calculation
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'DELIVERED');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysCompleted = completedDeliveries.filter(
    (d) => new Date(d.deliveredAt || d.updatedAt) >= todayStart
  );

  const todaysEarnings = todaysCompleted.reduce(
    (sum, d) => sum + (d.order?.deliveryFee || 20),
    0
  );

  const totalEarnings = completedDeliveries.reduce(
    (sum, d) => sum + (d.order?.deliveryFee || 20),
    0
  );

  const assignedCount = myDeliveries.filter((d) =>
    ['ASSIGNED', 'ACCEPTED', 'ARRIVED_AT_SHOP'].includes(d.status)
  ).length;

  const activeCount = myDeliveries.filter((d) =>
    ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status)
  ).length;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '0.75rem',
                background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isOnline ? 'var(--success)' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
              }}
            >
              <Truck size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Delivery Partner Portal
                </h1>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '1rem',
                    background: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: isOnline ? '#10b981' : '#ef4444',
                    border: `1px solid ${isOnline ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0.2rem 0 0 0' }}>
                Logged in as <strong>{user?.name}</strong> • Real-time Campus Delivery Workflow
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleToggleOnline}
              className="btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isOnline ? '#ef4444' : '#10b981',
                borderColor: isOnline ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)',
              }}
              disabled={togglingOnline}
            >
              <Power size={14} />
              <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
            </button>

            <button
              onClick={fetchAllData}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', color: '#ef4444', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} /> <span style={{ fontWeight: '500' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} /> <span style={{ fontWeight: '500' }}>{success}</span>
        </div>
      )}

      {/* Stats & Earnings Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Available Jobs</span>
          <strong style={{ fontSize: '1.7rem', color: '#38bdf8' }}>{availableDeliveries.length}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Active Deliveries</span>
          <strong style={{ fontSize: '1.7rem', color: 'var(--warning)' }}>{assignedCount + activeCount}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Completed</span>
          <strong style={{ fontSize: '1.7rem', color: 'var(--success)' }}>{completedDeliveries.length}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Today's Earnings</span>
          <strong style={{ fontSize: '1.7rem', color: '#f59e0b' }}>₹{todaysEarnings}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Earnings</span>
          <strong style={{ fontSize: '1.7rem', color: '#10b981' }}>₹{totalEarnings}</strong>
        </div>
      </div>

      {/* Active Delivery Focus Card */}
      {activeDelivery && activeDelivery.order && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ color: 'var(--primary)' }} size={22} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                ACTIVE DELIVERY IN PROGRESS
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isOutForDelivery && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '1rem',
                    background: geoStatus === 'LIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: geoStatus === 'LIVE' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${geoStatus === 'LIVE' ? '#10b981' : '#f59e0b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Navigation size={12} className={geoStatus === 'LIVE' ? 'spin' : ''} />
                  <span>{geoStatus === 'LIVE' ? 'GPS LIVE SHARING' : 'GPS CONNECTING...'}</span>
                </span>
              )}
              <span
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                }}
              >
                {activeDelivery.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Order Number</p>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>#{activeDelivery.order.orderNumber}</strong>
            </div>
            <div>
              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pickup Shop</p>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{activeDelivery.order.shop?.name}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeDelivery.order.shop?.address}</span>
            </div>
            <div>
              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Customer & Address</p>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{activeDelivery.order.user?.name} ({activeDelivery.order.user?.phone})</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeDelivery.order.address?.fullAddress}</span>
            </div>
            <div>
              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount to Collect</p>
              <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                ₹{activeDelivery.order.totalAmount} ({activeDelivery.order.paymentMethod})
              </strong>
            </div>
          </div>

          {(() => {
            const action = getNextAction(activeDelivery.status);
            if (!action) return null;

            return (
              <button
                onClick={() => handleUpdateStatus(activeDelivery._id, action.nextState)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '1rem',
                  fontWeight: '800',
                  letterSpacing: '0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem',
                }}
                disabled={statusUpdatingId === activeDelivery._id}
              >
                <span>{statusUpdatingId === activeDelivery._id ? 'Updating Status...' : action.label}</span>
                <ArrowRight size={18} />
              </button>
            );
          })()}
        </div>
      )}

      {/* Available Deliveries Section */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Package style={{ color: '#38bdf8' }} size={22} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Available Deliveries ({availableDeliveries.length})
          </h3>
        </div>

        {!isOnline ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '0.5rem', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: '#ef4444', margin: 0, fontWeight: '600' }}>
              You are currently OFFLINE. Switch status to ONLINE to receive available orders.
            </p>
          </div>
        ) : loading && availableDeliveries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Checking for available orders...</p>
        ) : availableDeliveries.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No unassigned orders available at this moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {availableDeliveries.map((item) => {
              const order = item.order;
              if (!order) return null;

              return (
                <div
                  key={item._id}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(7, 17, 31, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        Order #{order.orderNumber}
                      </strong>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{order.totalAmount} ({order.paymentMethod})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Shop:</strong> {order.shop?.name || 'Campus Shop'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Shop Address:</strong> {order.shop?.address || 'Main Campus'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Items:</strong> {order.items?.length || 0} item(s)
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Delivery Address:</strong> {order.address?.fullAddress || order.address?.hostelBlock || 'Campus Address'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptDelivery(order._id)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      gap: '0.5rem',
                    }}
                    disabled={acceptingId === order._id}
                  >
                    <span>{acceptingId === order._id ? 'Accepting...' : 'ACCEPT DELIVERY'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Assigned Deliveries Roster Section */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          My Active & Pending Roster ({myDeliveries.filter((d) => d.status !== 'DELIVERED').length})
        </h3>

        {loading && myDeliveries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading assigned deliveries...</p>
        ) : myDeliveries.filter((d) => d.status !== 'DELIVERED').length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No active deliveries assigned to you.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {myDeliveries
              .filter((d) => d.status !== 'DELIVERED')
              .map((del) => {
                const action = getNextAction(del.status);
                const order = del.order;

                return (
                  <div
                    key={del._id}
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(7, 17, 31, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          Order #{order?.orderNumber || 'N/A'}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                          Assigned on {new Date(del.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {del.status}
                      </span>
                    </div>

                    {order && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        <p><strong>Pickup Shop:</strong> {order.shop?.name} ({order.shop?.address})</p>
                        <p><strong>Customer:</strong> {order.user?.name} ({order.user?.phone})</p>
                        <p><strong>Delivery Address:</strong> {order.address?.fullAddress || 'Campus Hostel Block'}</p>
                        <p><strong>Total Amount:</strong> ₹{order.totalAmount} ({order.paymentMethod})</p>
                      </div>
                    )}

                    {action && (
                      <button
                        onClick={() => handleUpdateStatus(del._id, action.nextState)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                        disabled={statusUpdatingId === del._id}
                      >
                        {statusUpdatingId === del._id ? 'Updating...' : action.label}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Completed Delivery History Section */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Delivery History ({completedDeliveries.length})
        </h3>

        {completedDeliveries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No completed delivery history yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {completedDeliveries.map((del) => {
              const order = del.order;
              return (
                <div
                  key={del._id}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(16, 185, 129, 0.04)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '0.6rem',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        Order #{order?.orderNumber || 'N/A'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '700' }}>✓ DELIVERED</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      Shop: {order?.shop?.name || 'Campus Shop'} • Address: {order?.address?.fullAddress || 'Hostel'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', display: 'block' }}>
                      ₹{order?.totalAmount || 0}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Earned: ₹{order?.deliveryFee || 20}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
