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

// Import database connection
import connectDB from './config/db.js';

// Import middleware
import errorHandler from './middleware/error.middleware.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Static files (for uploaded files)
app.use('/uploads', express.static('uploads'));

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

// API Routes (to be added in Phase 1+)
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/users', require('./routes/user.routes'));
// app.use('/api/accommodations', require('./routes/accommodation.routes'));
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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║  🏠 SLIIT Accommodation System - Server Running           ║
  ║  📡 Port: ${PORT}                                        ║
  ║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                        ║
  ║  📅 Started: ${new Date().toLocaleString()}               ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
