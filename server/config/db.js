// ============================================================================
// MongoDB Database Connection Configuration
// ============================================================================

import mongoose from 'mongoose';
import Review from '../models/Review.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ no longer needs these options:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║  ✅ MongoDB Connected Successfully                        ║
    ║  📦 Database: ${conn.connection.name.padEnd(41)}║
    ║  🖥️  Host: ${conn.connection.host.padEnd(44)}║
    ╚════════════════════════════════════════════════════════════╝
    `);

    // Keep review indexes aligned with current schema (drops stale unique index if present).
    await Review.syncIndexes();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
