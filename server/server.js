// ============================================================================
// SLIIT Student Accommodation Management System - Server Entry Point
// ============================================================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import database connection
import connectDB from './config/db.js';

// Import middleware
import errorHandler from './middleware/error.middleware.js';

// Initialize Express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configuredUploadPath = process.env.UPLOAD_PATH || './uploads';
const uploadsDirectory = path.isAbsolute(configuredUploadPath)
  ? configuredUploadPath
  : path.resolve(__dirname, configuredUploadPath);

// Connect to MongoDB
connectDB();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
const normalizeOrigin = (url = '') => url.trim().replace(/\/$/, '');

const configuredClientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredClientUrls,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header) and configured browser origins.
    const normalizedOrigin = normalizeOrigin(origin || '');

    if (!origin || allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 50 * 60 * 1000, // 50 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.originalUrl.startsWith('/api/auth/logout')
});
app.use('/api/', limiter);

// Static files (for uploaded files)
app.use('/uploads', express.static(uploadsDirectory));

// ============================================================================
// ROUTES
// ============================================================================

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import accommodationRoutes from './routes/accommodation.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import inquiryRoutes from './routes/inquiry.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import serviceProviderRoutes from './routes/serviceProvider.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportRoutes from './routes/report.routes.js';
import reviewRoutes from './routes/review.routes.js';
import aiSummaryRoutes from './routes/aiSummary.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai-summaries', aiSummaryRoutes);
app.use('/api/notifications', notificationRoutes);

// Additional routes (to be added in future phases)
// app.use('/api/rooms', require('./routes/room.routes'));
// app.use('/api/bookings', require('./routes/booking.routes'));
// app.use('/api/payments', require('./routes/payment.routes'));
// app.use('/api/invoices', require('./routes/invoice.routes'));
// app.use('/api/reviews', require('./routes/review.routes'));
// app.use('/api/ai-summaries', require('./routes/aiSummary.routes'));
// app.use('/api/tickets', require('./routes/ticket.routes'));
// app.use('/api/notifications', require('./routes/notification.routes'));
// app.use('/api/inquiries', require('./routes/inquiry.routes'));
// app.use('/api/favorites', require('./routes/favorite.routes'));
// app.use('/api/reports', require('./routes/report.routes'));
// app.use('/api/admin', require('./routes/admin.routes'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const BASE_PORT = Number(process.env.PORT) || 5000;
let server;

const startServer = (port) => {
  server = app.listen(port, () => {
    console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║  🏠 SLIIT Accommodation System - Server Running           ║
  ║  📡 Port: ${port}                                        ║
  ║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                        ║
  ║  📅 Started: ${new Date().toLocaleString()}               ║
  ╚════════════════════════════════════════════════════════════╝
  `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    throw err;
  });
};

startServer(BASE_PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
