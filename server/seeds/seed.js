// ============================================================================
// Database Seeder - Populate MongoDB with Sample Data
// ============================================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
const Review = require('../models/Review');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const Notification = require('../models/Notification');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Hash password helper
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Clear all data
const clearData = async () => {
  console.log('\n🗑️  Clearing existing data...');

  await User.deleteMany({});
  await Accommodation.deleteMany({});
  await Room.deleteMany({});
  await Booking.deleteMany({});
  await Payment.deleteMany({});
  await Review.deleteMany({});
  await MaintenanceTicket.deleteMany({});
  await Notification.deleteMany({});

  console.log('✅ All data cleared');
};

// Seed Users
const seedUsers = async () => {
  console.log('\n👥 Seeding users...');

  const hashedPassword = await hashPassword('Password123!');

  // Create Admin
  const admin = await Admin.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@sliit.lk',
    password: hashedPassword,
    phone: '+94771234567',
    role: 'admin',
    accountStatus: 'active',
    isEmailVerified: true,
    adminLevel: 'super_admin',
    permissions: [
      'manage_users',
      'manage_accommodations',
      'manage_payments',
      'manage_reports',
      'manage_notifications',
      'manage_tickets',
      'view_analytics'
    ]
  });

  // Create Students
  const student1 = await Student.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@my.sliit.lk',
    password: hashedPassword,
    phone: '+94771234568',
    role: 'student',
    accountStatus: 'active',
    isEmailVerified: true,
    sliitEmail: 'john@my.sliit.lk',
    studentId: 'IT23822580',
    batch: 'Y3S2',
    faculty: 'Computing',
    favorites: []
  });

  const student2 = await Student.create({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@my.sliit.lk',
    password: hashedPassword,
    phone: '+94771234569',
    role: 'student',
    accountStatus: 'active',
    isEmailVerified: true,
    sliitEmail: 'jane@my.sliit.lk',
    studentId: 'IT23822581',
    batch: 'Y3S2',
    faculty: 'Computing',
    favorites: []
  });

  // Create Owners
  const owner1 = await Owner.create({
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael@gmail.com',
    password: hashedPassword,
    phone: '+94771234570',
    role: 'owner',
    accountStatus: 'active',
    isEmailVerified: true,
    nic: '199512345678',
    verificationStatus: 'verified',
    bankDetails: {
      bankName: 'Commercial Bank',
      branchName: 'Malabe',
      accountNumber: '1234567890',
      accountHolderName: 'Michael Brown'
    }
  });

  const owner2 = await Owner.create({
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah@gmail.com',
    password: hashedPassword,
    phone: '+94771234571',
    role: 'owner',
    accountStatus: 'active',
    isEmailVerified: true,
    nic: '199612345678',
    verificationStatus: 'verified',
    bankDetails: {
      bankName: 'Sampath Bank',
      branchName: 'Colombo',
      accountNumber: '0987654321',
      accountHolderName: 'Sarah Wilson'
    }
  });

  // Create Service Provider
  const provider = await ServiceProvider.create({
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david@gmail.com',
    password: hashedPassword,
    phone: '+94771234572',
    role: 'service_provider',
    accountStatus: 'active',
    isEmailVerified: true,
    nic: '199712345678',
    serviceCategories: ['plumbing', 'electrical', 'general'],
    areasOfOperation: [
      {
        district: 'Colombo',
        cities: ['Malabe', 'Kaduwela', 'Athurugiriya']
      }
    ],
    verificationStatus: 'approved',
    isAvailable: true
  });

  console.log('✅ Users seeded successfully');

  return { admin, student1, student2, owner1, owner2, provider };
};

// Seed Accommodations
const seedAccommodations = async (owner1, owner2) => {
  console.log('\n🏠 Seeding accommodations...');

  const accommodation1 = await Accommodation.create({
    title: 'Modern Student Apartment near SLIIT',
    description: 'Fully furnished apartment perfect for SLIIT students. Walking distance to campus.',
    accommodationType: 'apartment',
    owner: owner1._id,
    location: {
      district: 'Colombo',
      city: 'Malabe',
      address: '123 Reid Avenue, Malabe',
      coordinates: {
        type: 'Point',
        coordinates: [79.9732, 6.9040]
      },
      distanceToSLIIT: 2.5,
      nearbyLandmarks: ['SLIIT Main Campus', 'Malabe Town']
    },
    pricing: {
      monthlyRent: 25000,
      deposit: 50000,
      billsIncluded: false,
      additionalBills: {
        water: 1000,
        electricity: 2000,
        other: 0
      }
    },
    facilities: {
      wifi: true,
      furniture: true,
      kitchen: false,
      laundry: true,
      parking: true,
      cctv: true,
      airConditioning: false,
      attachedBathroom: true,
      hotWater: true,
      studyArea: true
    },
    houseRules: {
      genderRestriction: 'none',
      visitorsAllowed: true,
      smokingAllowed: false,
      petsAllowed: false,
      noiseRestrictions: true,
      alcoholAllowed: false
    },
    media: {
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
          caption: 'Living room',
          isPrimary: true
        },
        {
          url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9',
          caption: 'Bedroom'
        }
      ],
      videos: []
    },
    roomTypes: ['single', 'double'],
    totalRooms: 2,
    availableRooms: 2,
    status: 'active',
    availabilityStatus: 'available'
  });

  const accommodation2 = await Accommodation.create({
    title: 'Cozy Boarding House for Students',
    description: 'Safe and comfortable boarding house with all amenities. Female students only.',
    accommodationType: 'boarding_house',
    owner: owner2._id,
    location: {
      district: 'Colombo',
      city: 'Malabe',
      address: '456 Athurugiriya Road, Malabe',
      coordinates: {
        type: 'Point',
        coordinates: [79.9832, 6.9140]
      },
      distanceToSLIIT: 3.2,
      nearbyLandmarks: ['Athurugiriya Junction', 'Malabe Market']
    },
    pricing: {
      monthlyRent: 18000,
      deposit: 36000,
      billsIncluded: true,
      additionalBills: {
        water: 0,
        electricity: 0,
        other: 0
      }
    },
    facilities: {
      wifi: true,
      furniture: true,
      kitchen: true,
      laundry: true,
      parking: false,
      cctv: true,
      airConditioning: true,
      attachedBathroom: true,
      hotWater: true,
      studyArea: true,
      mealsProvided: true
    },
    houseRules: {
      genderRestriction: 'girls_only',
      visitorsAllowed: false,
      smokingAllowed: false,
      petsAllowed: false,
      noiseRestrictions: true,
      alcoholAllowed: false
    },
    media: {
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
          caption: 'Front view',
          isPrimary: true
        },
        {
          url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
          caption: 'Common area'
        }
      ],
      videos: []
    },
    roomTypes: ['single'],
    totalRooms: 3,
    availableRooms: 3,
    status: 'active',
    availabilityStatus: 'available'
  });

  console.log('✅ Accommodations seeded successfully');

  return { accommodation1, accommodation2 };
};

// Seed Rooms
const seedRooms = async (accommodation1, accommodation2) => {
  console.log('\n🛏️  Seeding rooms...');

  // Rooms for Accommodation 1
  const room1 = await Room.create({
    accommodation: accommodation1._id,
    roomNumber: '101',
    roomType: 'single',
    floor: 1,
    maxOccupants: 1,
    currentOccupants: 0,
    hasAttachedBathroom: true,
    hasAirConditioning: false,
    isFurnished: true,
    status: 'available'
  });

  const room2 = await Room.create({
    accommodation: accommodation1._id,
    roomNumber: '102',
    roomType: 'double',
    floor: 1,
    maxOccupants: 2,
    currentOccupants: 0,
    hasAttachedBathroom: true,
    hasAirConditioning: false,
    isFurnished: true,
    status: 'available'
  });

  // Rooms for Accommodation 2
  const room3 = await Room.create({
    accommodation: accommodation2._id,
    roomNumber: '201',
    roomType: 'single',
    floor: 2,
    maxOccupants: 1,
    currentOccupants: 0,
    hasAttachedBathroom: true,
    hasAirConditioning: true,
    isFurnished: true,
    status: 'available'
  });

  const room4 = await Room.create({
    accommodation: accommodation2._id,
    roomNumber: '202',
    roomType: 'single',
    floor: 2,
    maxOccupants: 1,
    currentOccupants: 0,
    hasAttachedBathroom: true,
    hasAirConditioning: true,
    isFurnished: true,
    status: 'available'
  });

  console.log('✅ Rooms seeded successfully');

  return { room1, room2, room3, room4 };
};

// Seed Bookings
const seedBookings = async (student1, room1, accommodation1, owner1) => {
  console.log('\n📅 Seeding bookings...');

  const booking1 = await Booking.create({
    bookingNumber: 'BK-2026-00001',
    student: student1._id,
    accommodation: accommodation1._id,
    room: room1._id,
    owner: owner1._id,
    roomType: 'single',
    checkInDate: new Date('2026-01-01'),
    checkOutDate: new Date('2026-06-30'),
    contractPeriod: '6_months',
    costSummary: {
      monthlyRent: 25000,
      keyMoney: 0,
      deposit: 50000,
      totalInitialPayment: 75000, // deposit + first month
      billsIncluded: false
    },
    studentDetails: {
      specialRequests: 'Prefer ground floor if available',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+94771111111',
        relationship: 'Mother'
      }
    },
    status: 'completed',
    confirmedAt: new Date('2026-01-01'),
    completedAt: new Date('2026-06-30'),
    paymentStatus: {
      depositPaid: true,
      keyMoneyPaid: true,
      currentMonthPaid: true,
      lastPaymentDate: new Date('2026-06-01'),
      outstandingAmount: 0
    }
  });

  console.log('✅ Bookings seeded successfully');

  return { booking1 };
};

// Seed Reviews
const seedReviews = async (student1, accommodation1, booking1) => {
  console.log('\n⭐ Seeding reviews...');

  const review1 = await Review.create({
    student: student1._id,
    accommodation: accommodation1._id,
    booking: booking1._id,
    overallRating: 4.5,
    categoryRatings: {
      cleanliness: 5,
      facilities: 5,
      location: 4,
      valueForMoney: 4,
      ownerResponse: 5
    },
    title: 'Excellent accommodation!',
    content: 'Great place! Very close to SLIIT and the owner is very responsive. Highly recommended for students.',
    status: 'approved'
  });

  console.log('✅ Reviews seeded successfully');

  return { review1 };
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🌱 Starting database seeding...');

    // Clear existing data
    await clearData();

    // Seed data in order (respecting relationships)
    const users = await seedUsers();
    const accommodations = await seedAccommodations(users.owner1, users.owner2);
    const rooms = await seedRooms(accommodations.accommodation1, accommodations.accommodation2);
    const bookings = await seedBookings(users.student1, rooms.room1, accommodations.accommodation1, users.owner1);
    const reviews = await seedReviews(users.student1, accommodations.accommodation1, bookings.booking1);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 6 Users (1 Admin, 2 Students, 2 Owners, 1 Provider)');
    console.log('   - 2 Accommodations');
    console.log('   - 4 Rooms');
    console.log('   - 1 Booking');
    console.log('   - 1 Review');
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin:    admin@sliit.lk / Password123!');
    console.log('   Student:  john@my.sliit.lk / Password123!');
    console.log('   Owner:    michael@gmail.com / Password123!');
    console.log('   Provider: david@gmail.com / Password123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
