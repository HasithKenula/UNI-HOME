# 🏠 SLIIT Student Accommodation Management System (UNI-HOME)

> A comprehensive MERN stack platform connecting SLIIT students with verified accommodation providers

## 📋 Overview

The SLIIT Student Accommodation Management System is a full-stack web application designed to help SLIIT university students find, book, and manage accommodation near campus. The platform connects students with property owners and service providers while providing administrative oversight and AI-powered review summaries.

## 🎯 Key Features

- **Student Portal**: Search accommodations, make bookings, submit reviews, manage favorites
- **Owner Dashboard**: List properties, manage bookings, handle tenant requests
- **Service Provider Interface**: Manage maintenance tickets and service requests
- **Admin Panel**: User verification, listing moderation, payment oversight, audit logs
- **AI Review Summaries**: Automated analysis of accommodation reviews
- **Payment Integration**: Secure payment processing with invoice generation
- **Notification System**: Real-time updates via email and in-app notifications

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express-validator

### Frontend
- **Framework**: React.js
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Notifications**: React Toastify

## 📁 Project Structure

```
UNI-HOME/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client configuration
│   │   ├── app/           # Redux store
│   │   ├── features/      # Feature-based modules
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Helper functions
│   │   ├── layouts/       # Layout components
│   │   └── routes/        # Route configuration
│   └── package.json
├── server/                # Express backend
│   ├── config/           # Configuration files
│   ├── models/           # Mongoose schemas (18 models)
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   ├── validators/       # Request validators
│   ├── server.js         # Entry point
│   └── package.json
├── docs/                 # Documentation
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd UNI-HOME
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Configure environment variables
```bash
# Create .env file in server/ directory
cp server/.env.example server/.env
# Edit .env with your configuration
```

5. Start MongoDB
```bash
mongod
```

6. Run the backend server
```bash
cd server
npm run dev
```

7. Run the frontend application
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Database Models

The system includes 18 MongoDB collections:
- User (base schema with discriminators)
- Student, Owner, ServiceProvider, Admin (user types)
- Accommodation, Room
- Booking, Payment, Invoice
- Review, AIReviewSummary
- MaintenanceTicket
- Notification, NotificationTemplate
- ListingReport, Inquiry
- AuditLog

## 🔐 User Roles

1. **Student** - Search and book accommodations
2. **Owner** - List and manage properties
3. **Service Provider** - Handle maintenance requests
4. **Admin** - System oversight and moderation

## 📝 License

This project is developed as part of SLIIT academic requirements.

## 👥 Contributors

SLIIT Computing Students - Y3S2 Module Project

## 📧 Contact

For queries, please contact the development team.