// ============================================================================
// Model Verification Script - Check if all models are properly registered
// ============================================================================

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const ServiceProvider = require('../models/ServiceProvider');
const Admin = require('../models/Admin');
const Accommodation = require('../models/Accommodation');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const AIReviewSummary = require('../models/AIReviewSummary');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const ListingReport = require('../models/ListingReport');
const Inquiry = require('../models/Inquiry');
const AuditLog = require('../models/AuditLog');

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
