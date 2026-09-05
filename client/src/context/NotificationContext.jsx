import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Socket.IO single global realtime connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let socket = null;

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

        socket = io(socketUrl, {
          auth: {
            token: socketToken,
          },
          withCredentials: true,
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log(
            '🔔 Notification socket connected:',
            socket.id
          );
        });

        socket.on('connect_error', (err) => {
          console.error(
            '❌ Notification socket connection error:',
            err.message
          );
        });

        socket.on('notification:new', (newNotification) => {
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

        socket.on('disconnect', (reason) => {
          console.log(
            '🔌 Notification socket disconnected:',
            reason
          );
        });
      } catch (err) {
        console.error('❌ Failed to setup notification socket:', err);
      }
    };

    fetchNotifications();
    setupSocket();

    return () => {
      if (socket) {
        socket.off('notification:new');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.disconnect();
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
