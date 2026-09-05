// import React, { useEffect, useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import api from '../services/api';
// import { Bell, CheckCheck, Clock, ArrowLeft, RefreshCw, ShoppingBag, Info, AlertTriangle } from 'lucide-react';

// export default function NotificationsPage() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [actionLoading, setActionLoading] = useState(false);
//   const navigate = useNavigate();

//   const fetchNotifications = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const res = await api.get('/notifications');
//       if (res.success) {
//         setNotifications(res.data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch notifications:', err);
//       setError(err.message || 'Failed to load notifications');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();
//   }, []);

//   const handleMarkAsRead = async (id) => {
//     try {
//       const res = await api.patch(`/notifications/${id}/read`);
//       if (res.success) {
//         setNotifications((prev) =>
//           prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
//         );
//       }
//     } catch (err) {
//       console.error('Failed to mark notification as read:', err);
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     try {
//       setActionLoading(true);
//       const res = await api.patch('/notifications/read-all');
//       if (res.success) {
//         setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
//       }
//     } catch (err) {
//       console.error('Failed to mark all notifications as read:', err);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleNotificationClick = async (notification) => {
//     if (!notification.isRead) {
//       await handleMarkAsRead(notification._id);
//     }

//     if (notification.relatedOrder) {
//       const orderId = typeof notification.relatedOrder === 'object' ? notification.relatedOrder._id : notification.relatedOrder;
//       navigate(`/orders/${orderId}`);
//     }
//   };

//   const formatTimestamp = (dateStr) => {
//     if (!dateStr) return '';
//     const date = new Date(dateStr);
//     return date.toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case 'ORDER':
//         return <ShoppingBag style={{ width: '1.2rem', height: '1.2rem', color: 'var(--primary)' }} />;
//       case 'DELIVERY':
//         return <Clock style={{ width: '1.2rem', height: '1.2rem', color: '#10b981' }} />;
//       case 'SYSTEM':
//       case 'SHOP':
//         return <AlertTriangle style={{ width: '1.2rem', height: '1.2rem', color: '#f59e0b' }} />;
//       default:
//         return <Info style={{ width: '1.2rem', height: '1.2rem', color: 'var(--primary)' }} />;
//     }
//   };

//   const unreadCount = notifications.filter((n) => !n.isRead).length;

//   return (
//     <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
//       {/* Header */}
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '2rem',
//           flexWrap: 'wrap',
//           gap: '1rem',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//           <button
//             onClick={() => navigate(-1)}
//             style={{
//               background: 'rgba(255,255,255,0.05)',
//               border: '1px solid var(--border-color)',
//               color: 'var(--text-primary)',
//               borderRadius: '0.5rem',
//               padding: '0.5rem',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <ArrowLeft size={18} />
//           </button>
//           <div>
//             <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
//               Notifications
//             </h1>
//             <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
//               Stay updated on your orders and account activity
//             </p>
//           </div>
//         </div>

//         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//           <button
//             onClick={fetchNotifications}
//             className="btn-secondary"
//             style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
//             disabled={loading}
//           >
//             <RefreshCw size={14} className={loading ? 'spin' : ''} />
//             <span>Refresh</span>
//           </button>

//           {unreadCount > 0 && (
//             <button
//               onClick={handleMarkAllAsRead}
//               className="btn-secondary"
//               style={{
//                 padding: '0.5rem 0.85rem',
//                 fontSize: '0.85rem',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '0.4rem',
//                 color: 'var(--primary)',
//                 borderColor: 'var(--primary)',
//               }}
//               disabled={actionLoading}
//             >
//               <CheckCheck size={16} />
//               <span>Mark All as Read</span>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Main Content */}
//       {loading && notifications.length === 0 ? (
//         <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
//           <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
//           <p>Loading notifications...</p>
//         </div>
//       ) : error ? (
//         <div
//           style={{
//             padding: '1.25rem',
//             borderRadius: '0.75rem',
//             background: 'rgba(239, 68, 68, 0.1)',
//             border: '1px solid rgba(239, 68, 68, 0.2)',
//             color: '#ef4444',
//             textAlign: 'center',
//           }}
//         >
//           <p>{error}</p>
//           <button
//             onClick={fetchNotifications}
//             className="btn-secondary"
//             style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
//           >
//             Try Again
//           </button>
//         </div>
//       ) : notifications.length === 0 ? (
//         <div
//           style={{
//             textAlign: 'center',
//             padding: '4rem 2rem',
//             background: 'var(--surface)',
//             borderRadius: '1rem',
//             border: '1px solid var(--border-color)',
//           }}
//         >
//           <div
//             style={{
//               width: '4rem',
//               height: '4rem',
//               borderRadius: '50%',
//               background: 'rgba(56, 189, 248, 0.1)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               margin: '0 auto 1.25rem auto',
//             }}
//           >
//             <Bell size={32} style={{ color: 'var(--primary)' }} />
//           </div>
//           <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
//             No Notifications Yet
//           </h3>
//           <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
//             When you receive updates about orders or shop status, they will appear right here.
//           </p>
//         </div>
//       ) : (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
//           {notifications.map((notification) => (
//             <div
//               key={notification._id}
//               onClick={() => handleNotificationClick(notification)}
//               style={{
//                 display: 'flex',
//                 alignItems: 'flex-start',
//                 gap: '1rem',
//                 padding: '1rem 1.25rem',
//                 borderRadius: '0.85rem',
//                 background: notification.isRead ? 'var(--surface)' : 'rgba(56, 189, 248, 0.06)',
//                 border: notification.isRead
//                   ? '1px solid var(--border-color)'
//                   : '1px solid rgba(56, 189, 248, 0.3)',
//                 cursor: notification.relatedOrder ? 'pointer' : 'default',
//                 transition: 'all 0.2s ease',
//                 position: 'relative',
//               }}
//             >
//               {!notification.isRead && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: '1.1rem',
//                     right: '1.1rem',
//                     width: '8px',
//                     height: '8px',
//                     borderRadius: '50%',
//                     background: 'var(--primary)',
//                   }}
//                 />
//               )}

//               <div
//                 style={{
//                   padding: '0.6rem',
//                   borderRadius: '0.5rem',
//                   background: 'rgba(255,255,255,0.05)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginTop: '0.1rem',
//                 }}
//               >
//                 {getNotificationIcon(notification.type)}
//               </div>

//               <div style={{ flex: 1 }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
//                   <h4
//                     style={{
//                       margin: 0,
//                       fontSize: '0.95rem',
//                       fontWeight: notification.isRead ? '600' : '700',
//                       color: 'var(--text-primary)',
//                     }}
//                   >
//                     {notification.title}
//                   </h4>
//                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: notification.isRead ? 0 : '1rem' }}>
//                     {formatTimestamp(notification.createdAt)}
//                   </span>
//                 </div>

//                 <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
//                   {notification.message}
//                 </p>

//                 {notification.relatedOrder && (
//                   <span
//                     style={{
//                       display: 'inline-block',
//                       marginTop: '0.5rem',
//                       fontSize: '0.78rem',
//                       color: 'var(--primary)',
//                       fontWeight: '600',
//                     }}
//                   >
//                     View Order Details →
//                   </span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Info,
  AlertTriangle,
} from 'lucide-react';

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllAsRead();
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    if (notification.relatedOrder) {
      const orderId =
        typeof notification.relatedOrder === 'object'
          ? notification.relatedOrder._id
          : notification.relatedOrder;

      if (orderId) {
        navigate(`/orders/${orderId}`);
      }
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return (
          <ShoppingBag
            style={{
              width: '1.2rem',
              height: '1.2rem',
              color: 'var(--primary)',
            }}
          />
        );

      case 'DELIVERY':
        return (
          <Clock
            style={{
              width: '1.2rem',
              height: '1.2rem',
              color: '#10b981',
            }}
          />
        );

      case 'SYSTEM':
      case 'SHOP':
        return (
          <AlertTriangle
            style={{
              width: '1.2rem',
              height: '1.2rem',
              color: '#f59e0b',
            }}
          />
        );

      default:
        return (
          <Info
            style={{
              width: '1.2rem',
              height: '1.2rem',
              color: 'var(--primary)',
            }}
          />
        );
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div
      className="container"
      style={{
        padding: '2rem 1rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: '700',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              Notifications
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              Stay updated on your orders and account activity
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={fetchNotifications}
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={loading ? 'spin' : ''}
            />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary"
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--primary)',
                borderColor: 'var(--primary)',
              }}
              disabled={actionLoading}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading && notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)',
          }}
        >
          <div
            className="spinner"
            style={{ margin: '0 auto 1rem auto' }}
          />

          <p>Loading notifications...</p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            textAlign: 'center',
          }}
        >
          <p>{error}</p>

          <button
            onClick={fetchNotifications}
            className="btn-secondary"
            style={{
              marginTop: '0.75rem',
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
            }}
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <Bell
              size={32}
              style={{ color: 'var(--primary)' }}
            />
          </div>

          <h3
            style={{
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
              fontSize: '1.2rem',
            }}
          >
            No Notifications Yet
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              maxWidth: '400px',
              margin: '0 auto 1.5rem auto',
            }}
          >
            When you receive updates about orders or shop status,
            they will appear right here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() =>
                handleNotificationClick(notification)
              }
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '0.85rem',
                background: notification.isRead
                  ? 'var(--surface)'
                  : 'rgba(56, 189, 248, 0.06)',
                border: notification.isRead
                  ? '1px solid var(--border-color)'
                  : '1px solid rgba(56, 189, 248, 0.3)',
                cursor: notification.relatedOrder
                  ? 'pointer'
                  : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {!notification.isRead && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1.1rem',
                    right: '1.1rem',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                  }}
                />
              )}

              <div
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem',
                }}
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '0.3rem',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: notification.isRead
                        ? '600'
                        : '700',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {notification.title}
                  </h4>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginRight: notification.isRead
                        ? 0
                        : '1rem',
                    }}
                  >
                    {formatTimestamp(notification.createdAt)}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                  }}
                >
                  {notification.message}
                </p>

                {notification.relatedOrder && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      fontSize: '0.78rem',
                      color: 'var(--primary)',
                      fontWeight: '600',
                    }}
                  >
                    View Order Details →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

