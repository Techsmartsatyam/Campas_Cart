import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shopkeeperRoutes from './routes/shopkeeperRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Express + Socket.IO
const httpServer = http.createServer(app);

import paymentRoutes from './routes/paymentRoutes.js';

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

// Initialize Socket.IO
initSocket(httpServer, corsOptions);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shopkeeper', shopkeeperRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// Connect DB and Start Server safely
const startServer = async () => {
  if (!process.env.MONGO_URI) {
    console.error('CRITICAL ERROR: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`🚀 CampusCart Server running on port ${PORT} (HTTP + Socket.IO)`);
  });
};

startServer();
