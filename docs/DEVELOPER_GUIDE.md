# 🛠️ Developer Guide - SLIIT Accommodation System

> Complete technical documentation for developers working on this project

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Code Style Guide](#code-style-guide)
- [Git Workflow](#git-workflow)
- [Testing](#testing)
- [Deployment](#deployment)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16.x or higher
- **MongoDB**: v5.x or higher
- **npm**: v8.x or higher
- **Git**: Latest version

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd UNI-HOME
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

4. **Configure Environment Variables**

Create `server/.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/sliit_accommodation_db

# JWT Secrets (Change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=SLIIT Accommodation <your_email@gmail.com>

# Client URL
CLIENT_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

Email note:
- Email delivery is used for application notifications such as booking confirmations and password reset links.
- Set real `EMAIL_USER` and `EMAIL_PASS` values (not placeholders) so outbound emails can be delivered successfully.

Create `client/.env` (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start MongoDB**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

6. **Run Backend Server**
```bash
cd server
npm run dev
```
Server will start on http://localhost:5000

7. **Run Frontend Application**
```bash
cd client
npm run dev
```
Client will start on http://localhost:3000

---

## 🏗️ Project Architecture

### Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT for authentication
- Nodemailer for emails
- Multer for file uploads

**Frontend:**
- React 18 with Vite
- Redux Toolkit (state management)
- React Router v6 (routing)
- Tailwind CSS (styling)
- Axios (HTTP client)

### Folder Structure

```
UNI-HOME/
│
├── server/                      # Backend API
│   ├── config/                  # Configuration files
│   │   └── db.js               # MongoDB connection
│   ├── models/                  # Mongoose schemas (18 models)
│   │   ├── User.js             # Base user model
│   │   ├── Student.js          # Student discriminator
│   │   ├── Owner.js            # Owner discriminator
│   │   ├── ServiceProvider.js  # Service provider discriminator
│   │   ├── Admin.js            # Admin discriminator
│   │   ├── Accommodation.js    # Listing model
│   │   ├── Room.js             # Room units
│   │   ├── Booking.js          # Booking records
│   │   ├── Payment.js          # Payment transactions
│   │   ├── Invoice.js          # Invoice generation
│   │   ├── Review.js           # Student reviews
│   │   ├── AIReviewSummary.js  # AI-generated summaries
│   │   ├── MaintenanceTicket.js # Maintenance requests
│   │   ├── Notification.js     # User notifications
│   │   ├── NotificationTemplate.js # Email templates
│   │   ├── ListingReport.js    # Reported listings
│   │   ├── Inquiry.js          # Student-owner messages
│   │   └── AuditLog.js         # System audit trail
│   ├── routes/                  # API routes (to be created)
│   ├── controllers/             # Route handlers (to be created)
│   ├── middleware/              # Custom middleware
│   │   ├── auth.middleware.js  # JWT verification
│   │   ├── role.middleware.js  # Role-based access
│   │   ├── validate.middleware.js # Request validation
│   │   ├── upload.middleware.js # File upload handling
│   │   └── error.middleware.js # Global error handler
│   ├── utils/                   # Helper functions
│   │   ├── email.util.js       # Email sending
│   │   ├── token.util.js       # JWT utilities
│   │   ├── pagination.util.js  # Pagination helper
│   │   ├── auditLog.util.js    # Audit logging
│   │   └── notification.util.js # Notifications
│   ├── validators/              # Request validators (to be created)
│   ├── seeds/                   # Database seeders (to be created)
│   ├── server.js               # Entry point
│   └── package.json
│
├── client/                      # Frontend React app
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── api/                # API client
│   │   │   └── axios.js        # Axios instance with interceptors
│   │   ├── app/                # Redux store
│   │   │   └── store.js        # Store configuration
│   │   ├── features/           # Feature-based modules (Redux slices)
│   │   │   ├── auth/           # Authentication
│   │   │   ├── accommodations/ # Listings
│   │   │   ├── bookings/       # Bookings
│   │   │   ├── payments/       # Payments
│   │   │   ├── reviews/        # Reviews
│   │   │   ├── tickets/        # Maintenance
│   │   │   ├── notifications/  # Notifications
│   │   │   └── admin/          # Admin
│   │   ├── components/         # React components
│   │   │   ├── common/         # Reusable UI
│   │   │   ├── auth/           # Auth components
│   │   │   ├── accommodation/  # Listing components
│   │   │   ├── booking/        # Booking components
│   │   │   ├── payment/        # Payment components
│   │   │   ├── review/         # Review components
│   │   │   ├── ticket/         # Ticket components
│   │   │   ├── notification/   # Notification components
│   │   │   └── admin/          # Admin components
│   │   ├── pages/              # Page components
│   │   │   ├── public/         # Public pages
│   │   │   ├── student/        # Student dashboard
│   │   │   ├── owner/          # Owner dashboard
│   │   │   ├── provider/       # Provider dashboard
│   │   │   └── admin/          # Admin panel
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   ├── layouts/            # Layout components
│   │   ├── routes/             # Route configuration
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── index.html
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── package.json
│
└── docs/                        # Documentation
    ├── PROJECT_TASKS.md         # Task list
    ├── schemas (1) (1).js       # Database schemas reference
    └── DEVELOPER_GUIDE.md       # This file
```

---

## 🔧 Backend Development

### File Naming Conventions

- **Models**: `ModelName.js` (PascalCase)
- **Routes**: `resource.routes.js` (lowercase)
- **Controllers**: `resource.controller.js` (lowercase)
- **Middleware**: `purpose.middleware.js` (lowercase)
- **Utils**: `purpose.util.js` (lowercase)

### Creating a New API Endpoint

**Step 1: Create Model** (if needed)
```javascript
// server/models/Example.js
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

module.exports = mongoose.model('Example', exampleSchema);
```

**Step 2: Create Controller**
```javascript
// server/controllers/example.controller.js
const Example = require('../models/Example');

// @desc    Get all examples
// @route   GET /api/examples
// @access  Public
exports.getExamples = async (req, res, next) => {
  try {
    const examples = await Example.find();
    res.status(200).json({
      success: true,
      data: examples
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create example
// @route   POST /api/examples
// @access  Private
exports.createExample = async (req, res, next) => {
  try {
    const example = await Example.create(req.body);
    res.status(201).json({
      success: true,
      data: example
    });
  } catch (error) {
    next(error);
  }
};
```

**Step 3: Create Validator** (optional)
```javascript
// server/validators/example.validator.js
const { body } = require('express-validator');

exports.createExampleValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),
];
```

**Step 4: Create Routes**
```javascript
// server/routes/example.routes.js
const express = require('express');
const router = express.Router();
const { getExamples, createExample } = require('../controllers/example.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createExampleValidator } = require('../validators/example.validator');

router.get('/', getExamples);
router.post(
  '/',
  protect,
  authorize('admin'),
  createExampleValidator,
  validate,
  createExample
);

module.exports = router;
```

**Step 5: Register Routes in server.js**
```javascript
// server/server.js
app.use('/api/examples', require('./routes/example.routes'));
```

### Authentication & Authorization

**Protecting Routes:**
```javascript
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Require login
router.get('/protected', protect, controller);

// Require specific role
router.get('/admin-only', protect, authorize('admin'), controller);

// Multiple roles allowed
router.get('/students-and-owners', protect, authorize('student', 'owner'), controller);
```

**Using in Controllers:**
```javascript
exports.getProfile = async (req, res) => {
  // req.user is available after protect middleware
  const user = req.user;
  res.json({ success: true, data: user });
};
```

### File Upload

```javascript
const { uploadSingle, uploadMultiple } = require('../middleware/upload.middleware');

// Single file
router.post('/upload', protect, uploadSingle('profileImage'), controller);

// Multiple files
router.post('/upload-multiple', protect, uploadMultiple('images', 5), controller);

// In controller
exports.uploadController = (req, res) => {
  const file = req.file; // Single file
  const files = req.files; // Multiple files
  // File path: file.path
  // File name: file.filename
};
```

### Pagination

```javascript
const { paginate } = require('../utils/pagination.util');

exports.getAccommodations = async (req, res) => {
  const result = await paginate(
    Accommodation,
    { status: 'active' },
    {
      page: req.query.page,
      limit: req.query.limit,
      sort: '-createdAt',
      populate: 'owner'
    }
  );

  res.json({
    success: true,
    ...result
  });
};
```

### Sending Emails

```javascript
const { sendEmail, sendVerificationEmail } = require('../utils/email.util');

// Custom email
await sendEmail({
  to: user.email,
  subject: 'Welcome!',
  html: '<h1>Welcome to our platform</h1>'
});

// Pre-built templates
await sendVerificationEmail(user, verificationToken);
await sendPasswordResetEmail(user, resetToken);
```

### Audit Logging

```javascript
const { logCRUD, logAuth, logAdmin } = require('../utils/auditLog.util');

// Log CRUD operations
await logCRUD.create(
  req.user._id,
  'accommodation',
  accommodation._id,
  { title: accommodation.title },
  req.ip,
  req.get('user-agent')
);

// Log authentication
await logAuth.login(user._id, req.ip, req.get('user-agent'));

// Log admin actions
await logAdmin.approve(
  admin._id,
  'owner',
  owner._id,
  { verificationStatus: 'verified' },
  req.ip,
  req.get('user-agent')
);
```

### Notifications

```javascript
const { createNotification, NotificationTemplates } = require('../utils/notification.util');

// Using templates
const template = NotificationTemplates.bookingConfirmed(booking, accommodation);
await createNotification(
  student._id,
  template.type,
  template,
  ['inApp', 'email']
);

// Custom notification
await createNotification(
  user._id,
  'custom_type',
  {
    title: 'Custom Title',
    message: 'Custom message',
    actionUrl: '/path'
  },
  ['inApp', 'email', 'sms']
);
```

---

## ⚛️ Frontend Development

### File Naming Conventions

- **Components**: `ComponentName.jsx` (PascalCase)
- **Pages**: `PageName.jsx` or `PageNamePage.jsx`
- **Hooks**: `useHookName.js` (camelCase with 'use' prefix)
- **Utils**: `utilName.js` (camelCase)
- **Slices**: `featureSlice.js` (camelCase)

### Creating a Redux Slice

```javascript
// client/src/features/example/exampleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

// Async thunk
export const fetchExamples = createAsyncThunk(
  'example/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/examples');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const exampleSlice = createSlice({
  name: 'example',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamples.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = exampleSlice.actions;
export default exampleSlice.reducer;
```

### Using Redux in Components

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { fetchExamples } from '../features/example/exampleSlice';

function ExampleComponent() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.example);

  useEffect(() => {
    dispatch(fetchExamples());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Protected Routes

```javascript
// client/src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
}

// Usage
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>
```

### API Calls with Axios

```javascript
import axios from '../api/axios';
import { toast } from 'react-toastify';

// GET request
const fetchData = async () => {
  try {
    const response = await axios.get('/api/accommodations');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error occurred');
    throw error;
  }
};

// POST request
const createData = async (data) => {
  try {
    const response = await axios.post('/api/accommodations', data);
    toast.success('Created successfully!');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error occurred');
    throw error;
  }
};
```

### Tailwind CSS Classes

**Common Button Styles:**
```jsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-outline">Outline Button</button>
```

**Card Component:**
```jsx
<div className="card">
  <h2 className="text-xl font-bold mb-4">Card Title</h2>
  <p className="text-gray-600">Card content</p>
</div>
```

**Form Input:**
```jsx
<input
  type="text"
  className="input"
  placeholder="Enter value..."
/>
```

---

## 🗄️ Database Schema

### User Hierarchy (Discriminator Pattern)

```
User (Base Model)
├── Student
├── Owner
├── ServiceProvider
└── Admin
```

All user types inherit from `User` model and have:
- Common fields: firstName, lastName, email, password, phone, role
- Role-specific fields in discriminator models

### Key Relationships

```
Student
  ├── hasMany: Bookings
  ├── hasMany: Reviews
  ├── hasMany: MaintenanceTickets
  └── hasMany: Favorites (Accommodations)

Owner
  ├── hasMany: Accommodations
  └── hasMany: Rooms (through Accommodations)

Accommodation
  ├── belongsTo: Owner
  ├── hasMany: Rooms
  ├── hasMany: Bookings
  └── hasMany: Reviews

Booking
  ├── belongsTo: Student
  ├── belongsTo: Room
  ├── hasOne: Payment
  └── hasOne: Invoice
```

### Indexes

Important indexes for performance:
- User: `email` (unique), `role + accountStatus`
- Accommodation: `location` (2dsphere), `title + description` (text)
- Booking: `student + status`, `checkInDate + checkOutDate`
- Review: `accommodation + student` (compound unique)

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.sliit-accommodation.lk/api
```

### Authentication

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@my.sliit.lk",
  "password": "SecurePass123",
  "phone": "+94771234567",
  "role": "student",
  "studentId": "IT23822580"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@my.sliit.lk",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGciOiJ...",
  "refreshToken": "eyJhbGciOiJ...",
  "user": { ... }
}
```

**Authenticated Requests:**
```http
GET /api/accommodations
Authorization: Bearer eyJhbGciOiJ...
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## 📝 Code Style Guide

### JavaScript/Node.js

- Use `const` by default, `let` when reassignment needed
- Use async/await instead of callbacks
- Use template literals for string concatenation
- Always use semicolons
- Use meaningful variable names

**Good:**
```javascript
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};
```

**Bad:**
```javascript
var u = function(id, cb) {
  User.findById(id, function(err, data) {
    if (err) cb(err);
    cb(null, data);
  });
};
```

### React/JSX

- Use functional components with hooks
- One component per file
- Use destructuring for props
- Keep components small and focused

**Good:**
```jsx
import React from 'react';

function UserCard({ user, onEdit }) {
  const { firstName, lastName, email } = user;

  return (
    <div className="card">
      <h3>{firstName} {lastName}</h3>
      <p>{email}</p>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
}

export default UserCard;
```

### Comments

- Use JSDoc for functions
- Explain "why", not "what"
- Keep comments up to date

```javascript
/**
 * Calculate accommodation availability for date range
 * @param {string} accommodationId - Accommodation ID
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {Promise<boolean>} True if available
 */
async function checkAvailability(accommodationId, checkIn, checkOut) {
  // Implementation
}
```

---

## 🌿 Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/<feature-name>` - New features
- `bugfix/<bug-name>` - Bug fixes
- `hotfix/<issue>` - Urgent production fixes

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Updating build tasks, dependencies

**Examples:**
```
feat(auth): add email verification for new users

fix(booking): correct date validation logic

docs(readme): update installation instructions
```

### Workflow Steps

1. **Create feature branch**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-payment-integration
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat(payment): integrate PayHere gateway"
```

3. **Push to remote**
```bash
git push origin feature/add-payment-integration
```

4. **Create Pull Request**
- Go to GitHub
- Create PR from feature branch to develop
- Request code review
- Address review comments

5. **Merge**
- After approval, merge to develop
- Delete feature branch

---

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test
```

**Example Test:**
```javascript
// server/tests/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@my.sliit.lk',
        password: 'TestPass123',
        role: 'student'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Testing

```bash
cd client
npm test
```

---

## 🚀 Deployment

### Environment Setup

**Production Environment Variables:**
```env
NODE_ENV=production
MONGO_URI=<production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://sliit-accommodation.lk
```

### Build Commands

**Backend:**
```bash
cd server
npm install --production
npm start
```

**Frontend:**
```bash
cd client
npm run build
# Serve the dist/ folder with a web server
```

### Deployment Checklist

- [ ] Update environment variables
- [ ] Set strong JWT secrets
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure CORS for production domain
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Test all critical flows

---

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

**Port Already in Use:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Module Not Found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For questions or issues:
- Check this documentation first
- Review [PROJECT_TASKS.md](PROJECT_TASKS.md)
- Contact the development team

---

**Last Updated:** March 2026
**Version:** 1.0.0
