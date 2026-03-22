# 🗄️ Database Setup Guide

## How Mongoose Models Work with MongoDB

With Mongoose, you **don't need to manually create tables/collections**. The models automatically:

1. **Register** when you import them
2. **Create collections** when first used (automatically pluralized)
   - `User` model → `users` collection
   - `Accommodation` model → `accommodations` collection
3. **Create indexes** when you first query the collection
4. **Validate data** based on your schema

## 🚀 Quick Start - Add Models to Database

### Step 1: Verify Models are Working

```bash
cd server
npm run verify
```

This will:
- Connect to MongoDB
- Show all 18 registered models
- Display collection names
- Show document counts
- List indexes

**Expected Output:**
```
✅ MongoDB Connected

📋 Verifying Models & Collections:

Model Name              Collection Name         Document Count
───────────────────────────────────────────────────────────────────────
User                    users                   0
Student                 users                   0
Owner                   users                   0
ServiceProvider         users                   0
Admin                   users                   0
Accommodation           accommodations          0
Room                    rooms                   0
...

✅ All 18 models verified successfully!
```

### Step 2: Populate Database with Sample Data

```bash
npm run seed
```

This will:
- Clear all existing data
- Create sample users (Admin, Students, Owners, Provider)
- Create 2 sample accommodations
- Create 4 sample rooms
- Create sample reviews

**Expected Output:**
```
🌱 Starting database seeding...

🗑️  Clearing existing data...
✅ All data cleared

👥 Seeding users...
✅ Users seeded successfully

🏠 Seeding accommodations...
✅ Accommodations seeded successfully

🛏️  Seeding rooms...
✅ Rooms seeded successfully

⭐ Seeding reviews...
✅ Reviews seeded successfully

✅ Database seeding completed successfully!

📊 Summary:
   - 6 Users (1 Admin, 2 Students, 2 Owners, 1 Provider)
   - 2 Accommodations
   - 4 Rooms
   - 1 Review

🔑 Test Credentials:
   Admin:    admin@sliit.lk / Password123!
   Student:  john@my.sliit.lk / Password123!
   Owner:    michael@gmail.com / Password123!
   Provider: david@gmail.com / Password123!
```

### Step 3: Verify Data was Added

```bash
npm run verify
```

Now you should see document counts > 0.

---

## 📝 Understanding the Models

### User Hierarchy (Discriminator Pattern)

All user types inherit from the base `User` model:

```
User (Base Collection: "users")
├── Student (discriminatorKey: "student")
├── Owner (discriminatorKey: "owner")
├── ServiceProvider (discriminatorKey: "service_provider")
└── Admin (discriminatorKey: "admin")
```

**All stored in ONE collection (`users`)** with a `role` field to distinguish types.

### Other Collections

Each model creates its own collection:

| Model | Collection Name | Purpose |
|-------|----------------|---------|
| Accommodation | accommodations | Property listings |
| Room | rooms | Individual room units |
| Booking | bookings | Student bookings |
| Payment | payments | Payment transactions |
| Invoice | invoices | Payment invoices |
| Review | reviews | Student reviews |
| AIReviewSummary | aireviewsummaries | AI-generated summaries |
| MaintenanceTicket | maintenancetickets | Maintenance requests |
| Notification | notifications | User notifications |
| NotificationTemplate | notificationtemplates | Email templates |
| ListingReport | listingreports | Reported listings |
| Inquiry | inquiries | Messages between users |
| AuditLog | auditlogs | System activity logs |

---

## 🔍 Viewing Your Data

### Using MongoDB Compass (Recommended)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string:
   ```
   mongodb+srv://sachintha:12345@cluster0.vc3jpvl.mongodb.net/UniHome
   ```
3. Browse the `UniHome` database
4. View collections and documents visually

### Using MongoDB Atlas Dashboard

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in to your account
3. Click on your cluster → Browse Collections
4. Select `UniHome` database
5. View your collections

### Using MongoDB Shell (mongosh)

```bash
# Connect to your database
mongosh "mongodb+srv://sachintha:12345@cluster0.vc3jpvl.mongodb.net/UniHome"

# Show all collections
show collections

# View users
db.users.find().pretty()

# Count documents
db.users.countDocuments()
db.accommodations.countDocuments()

# Find specific user
db.users.findOne({ email: "john@my.sliit.lk" })

# Exit
exit
```

---

## 🧪 Testing Models in Your Code

### Example: Create a new student

```javascript
// In your route controller
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Create new student
const hashedPassword = await bcrypt.hash('password123', 10);

const newStudent = await Student.create({
  firstName: 'Test',
  lastName: 'Student',
  email: 'test@my.sliit.lk',
  password: hashedPassword,
  phone: '+94771234567',
  role: 'student',
  sliitEmail: 'test@my.sliit.lk',
  studentId: 'IT23999999',
  batch: 'Y3S2',
  faculty: 'Computing'
});

console.log('Student created:', newStudent);
```

### Example: Find accommodations

```javascript
const Accommodation = require('../models/Accommodation');

// Find all active accommodations
const accommodations = await Accommodation.find({ status: 'active' })
  .populate('owner', 'firstName lastName email')
  .limit(10);

console.log('Found accommodations:', accommodations);
```

### Example: Create booking

```javascript
const Booking = require('../models/Booking');

const booking = await Booking.create({
  student: studentId,
  room: roomId,
  accommodation: accommodationId,
  checkInDate: new Date('2026-04-01'),
  checkOutDate: new Date('2026-07-31'),
  numberOfOccupants: 1,
  monthlyRent: 25000,
  totalAmount: 75000,
  status: 'pending'
});
```

---

## ⚠️ Important Notes

### Automatic Collection Creation

Collections are created automatically when you:
1. Insert the first document
2. Query a non-existent collection (creates it empty)

You **do NOT need to**:
- Run migrations
- Create tables manually
- Define collections separately

### Indexes

Indexes are defined in the models but created when:
1. First document is inserted
2. You explicitly call `Model.ensureIndexes()`

To ensure indexes are created:
```javascript
// In server.js or after connecting to DB
await User.ensureIndexes();
await Accommodation.ensureIndexes();
// ... for all models
```

### Schema Validation

Mongoose validates all data **before** saving to MongoDB:
- Required fields must be present
- Types must match
- Enums must be one of allowed values
- Custom validators run automatically

---

## 🛠️ Useful Commands Reference

```bash
# Verify models are registered
npm run verify

# Populate database with sample data
npm run seed

# Start development server
npm run dev

# Start server in production
npm start
```

---

## 🐛 Troubleshooting

### "Collection not found" error
- Collections are created automatically on first insert
- This is normal if database is empty

### "Index error" or duplicate key
- Clear data and re-seed: `npm run seed`
- Or drop the database from MongoDB Compass

### "Model not registered" error
- Make sure you're importing the model correctly
- Check file paths are correct
- Ensure model file exports the model

### Can't connect to MongoDB
- Check your `.env` file has correct `MONGO_URI`
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas

---

## 📚 Next Steps

1. ✅ Verify models: `npm run verify`
2. ✅ Seed database: `npm run seed`
3. ✅ Start server: `npm run dev`
4. ✅ Test health endpoint: `http://localhost:5000/api/health`
5. 🚀 Begin Phase 1: Create authentication routes

---

**Last Updated:** March 2026
