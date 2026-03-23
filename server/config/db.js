// ============================================================================
// MongoDB Database Connection Configuration
// ============================================================================

import mongoose from 'mongoose';

const RETRY_DELAY_MS = 5000;
let hasRegisteredDbListeners = false;

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

    if (!hasRegisteredDbListeners) {
      hasRegisteredDbListeners = true;

      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });
    }

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log(`🔁 Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
};

export default connectDB;
