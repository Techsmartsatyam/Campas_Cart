import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';

let ioInstance = null;

const parseCookies = (header) => {
  if (typeof cookie.parse === 'function') {
    return cookie.parse(header);
  }
  if (cookie.default && typeof cookie.default.parse === 'function') {
    return cookie.default.parse(header);
  }
  return {};
};

export const initSocket = (httpServer, corsOptions) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  // Socket Authentication Middleware using HTTP-only Cookie
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake?.auth?.token;
      if (!token && socket.request.headers.cookie) {
        const cookies = parseCookies(socket.request.headers.cookie);
        const cookieName = process.env.COOKIE_NAME || 'campuscart_token';
        token = cookies[cookieName];
      }

      if (!token) {
        return next(new Error('Authentication failed: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication failed: User inactive or invalid'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn('Socket authentication error:', err.message);
      next(new Error('Authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.user.name} (${socket.user.role}) [ID: ${socket.id}]`);

    // Join Delivery Room (with authorization checks)
    socket.on('delivery:join', async ({ orderId }) => {
      try {
        if (!orderId) return;

        const order = await Order.findById(orderId);
        if (!order) return;

        // Authorization check
        const isStudent = socket.user.role === 'STUDENT' && order.user.toString() === socket.user._id.toString();
        const isShopkeeper = socket.user.role === 'SHOPKEEPER' && order.shop.toString() === (socket.user.shopId || order.shop.toString());
        const isDeliveryBoy = socket.user.role === 'DELIVERY_BOY';

        if (!isStudent && !isShopkeeper && !isDeliveryBoy) {
          console.warn(`Unauthorized room join attempt by ${socket.user._id} for order ${orderId}`);
          return;
        }

        const roomName = `delivery:${orderId}`;
        socket.join(roomName);
        console.log(`User ${socket.user.name} joined room ${roomName}`);
      } catch (err) {
        console.error('Error joining delivery room:', err);
      }
    });

    // Leave Delivery Room
    socket.on('delivery:leave', ({ orderId }) => {
      if (orderId) {
        const roomName = `delivery:${orderId}`;
        socket.leave(roomName);
        console.log(`User ${socket.user.name} left room ${roomName}`);
      }
    });

    // Handle Real-Time Location Broadcasting from Delivery Boy
    socket.on('delivery:location', async (data) => {
      try {
        const { orderId, latitude, longitude, accuracy, timestamp } = data;

        // Security check: Only assigned DELIVERY_BOY can broadcast location
        if (socket.user.role !== 'DELIVERY_BOY') {
          return;
        }

        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          isNaN(latitude) ||
          isNaN(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          return;
        }

        const delivery = await Delivery.findOne({ order: orderId, deliveryBoy: socket.user._id });
        if (!delivery) {
          return;
        }

        const roomName = `delivery:${orderId}`;

        // Broadcast to student & shopkeeper in room
        io.to(roomName).emit('delivery:location:update', {
          orderId,
          latitude,
          longitude,
          accuracy: accuracy || 10,
          timestamp: timestamp || Date.now(),
        });

        // Persist location periodically in DB
        delivery.currentLocation = {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON format: [long, lat]
        };
        await delivery.save();
      } catch (err) {
        console.error('Error handling delivery:location event:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} [ID: ${socket.id}]`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io instance has not been initialized');
  }
  return ioInstance;
};
