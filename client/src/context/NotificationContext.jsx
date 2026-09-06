import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { requestAndRegisterFCMToken, setupForegroundFCMListener } from '../services/firebase';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/notifications');
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.success && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Register FCM device token on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      requestAndRegisterFCMToken(api);
      const unsubscribeFCM = setupForegroundFCMListener((payload) => {
        console.log('FCM Foreground Payload:', payload);
        fetchNotifications();
      });
      return () => {
        if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
      };
    }
  }, [isAuthenticated, user?._id, fetchNotifications]);

  // Socket.IO single global realtime connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setSocket(null);
      return;
    }

    let socketInstance = null;

    const setupSocket = async () => {
      try {
        const response = await api.get('/auth/socket-token');
        const socketToken = response.data?.socketToken || response.socketToken;

        if (!socketToken) {
          console.error('❌ Socket token not received');
          return;
        }

        const apiUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace(/\/api\/?$/, '');

        socketInstance = io(socketUrl, {
          auth: {
            token: socketToken,
          },
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketInstance.on('connect', () => {
          console.log(
            '🔔 Notification socket connected:',
            socketInstance.id
          );
        });

        socketInstance.on('connect_error', (err) => {
          console.error(
            '❌ Notification socket connection error:',
            err.message
          );
        });

        socketInstance.on('notification:new', (newNotification) => {
          console.log(
            '🔔 New real-time notification:',
            newNotification
          );

          if (!newNotification?._id) return;

          setNotifications((prev) => {
            const alreadyExists = prev.some(
              (notification) => notification._id === newNotification._id
            );
            if (alreadyExists) return prev;
            return [newNotification, ...prev];
          });

          setUnreadCount((prev) => prev + 1);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log(
            '🔌 Notification socket disconnected:',
            reason
          );
        });

        setSocket(socketInstance);
      } catch (err) {
        console.error('❌ Failed to setup notification socket:', err);
      }
    };

    fetchNotifications();
    setupSocket();

    return () => {
      if (socketInstance) {
        socketInstance.off('notification:new');
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('disconnect');
        socketInstance.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated, user?._id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        socket,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
