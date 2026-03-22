// ============================================================================
// Model Verification Script - Check if all models are properly registered
// ============================================================================

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

// Import all models
import User from '../models/User.js';
import Student from '../models/Student.js';
import Owner from '../models/Owner.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Admin from '../models/Admin.js';
import Accommodation from '../models/Accommodation.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';
import AIReviewSummary from '../models/AIReviewSummary.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import ListingReport from '../models/ListingReport.js';
import Inquiry from '../models/Inquiry.js';
import AuditLog from '../models/AuditLog.js';

const verifyModels = async () => {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    console.log('📋 Verifying Models & Collections:\n');

    // Get all registered models
    const models = [
      { name: 'User', model: User },
      { name: 'Student', model: Student },
      { name: 'Owner', model: Owner },
      { name: 'ServiceProvider', model: ServiceProvider },
      { name: 'Admin', model: Admin },
      { name: 'Accommodation', model: Accommodation },
      { name: 'Room', model: Room },
      { name: 'Booking', model: Booking },
      { name: 'Payment', model: Payment },
      { name: 'Invoice', model: Invoice },
      { name: 'Review', model: Review },
      { name: 'AIReviewSummary', model: AIReviewSummary },
      { name: 'MaintenanceTicket', model: MaintenanceTicket },
      { name: 'Notification', model: Notification },
      { name: 'NotificationTemplate', model: NotificationTemplate },
      { name: 'ListingReport', model: ListingReport },
      { name: 'Inquiry', model: Inquiry },
      { name: 'AuditLog', model: AuditLog }
    ];

    console.log('Model Name'.padEnd(25) + 'Collection Name'.padEnd(25) + 'Document Count');
    console.log('─'.repeat(75));

    for (const { name, model } of models) {
      const collectionName = model.collection.name;
      const count = await model.countDocuments();
      console.log(
        `${name.padEnd(25)}${collectionName.padEnd(25)}${count}`
      );
    }

    console.log('─'.repeat(75));
    console.log(`\n✅ All ${models.length} models verified successfully!\n`);

    // Show indexes
    console.log('\n📑 Checking Indexes:\n');

    const userIndexes = await User.collection.getIndexes();
    console.log('User Indexes:', Object.keys(userIndexes).join(', '));

    const accomIndexes = await Accommodation.collection.getIndexes();
    console.log('Accommodation Indexes:', Object.keys(accomIndexes).join(', '));

    console.log('\n✅ Models are ready to use!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Error:', error.message);
    process.exit(1);
  }
};

verifyModels();
