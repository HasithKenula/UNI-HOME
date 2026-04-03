# 📡 API Documentation - SLIIT Accommodation System

> RESTful API endpoints for the SLIIT Student Accommodation Management System

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.sliit-accommodation.lk/api
```

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@my.sliit.lk",
  "password": "SecurePass123!",
  "phone": "+94771234567",
  "role": "student",
  "studentId": "IT23822580",
  "batch": "Y3S2",
  "faculty": "Computing"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "accessToken": "eyJhbGciOiJ...",
  "refreshToken": "eyJhbGciOiJ...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@my.sliit.lk",
    "role": "student",
    "accountStatus": "pending"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@my.sliit.lk",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJ...",
  "refreshToken": "eyJhbGciOiJ...",
  "user": { ... }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

Body:
{
  "refreshToken": "eyJhbGciOiJ..."
}

Response: 200 OK
{
  "success": true,
  "accessToken": "eyJhbGciOiJ...",
  "refreshToken": "eyJhbGciOiJ..."
}
```

### Verify Email
```http
GET /api/auth/verify-email?token=<verification-token>

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

Body:
{
  "email": "john@my.sliit.lk"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

Body:
{
  "token": "<reset-token>",
  "password": "NewSecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 👤 User Management

### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@my.sliit.lk",
    "role": "student",
    "studentId": "IT23822580"
  }
}
```

### Update Profile
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "firstName": "John",
  "phone": "+94771234567",
  "address": {
    "street": "123 Main St",
    "city": "Malabe",
    "district": "Colombo"
  }
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Upload Profile Image
```http
POST /api/users/me/profile-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
profileImage: <file>

Response: 200 OK
{
  "success": true,
  "data": {
    "profileImage": "/uploads/profiles/profileImage-userId-timestamp.jpg"
  }
}
```

### Change Password
```http
PUT /api/users/me/password
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🏠 Accommodations

### Get All Accommodations (Public)
```http
GET /api/accommodations
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10, max: 100)
  - sort: string (default: -createdAt)
  - city: string
  - district: string
  - type: enum [apartment, house, annex, hostel, boarding]
  - minPrice: number
  - maxPrice: number
  - minRating: number
  - facilities: string (comma-separated)
  - search: string (text search)

Example:
GET /api/accommodations?city=Malabe&minPrice=10000&maxPrice=30000&facilities=wifi,parking

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Comfortable Student Apartment",
      "type": "apartment",
      "location": {
        "address": "123 Reid Avenue",
        "city": "Malabe",
        "district": "Colombo",
        "coordinates": [79.9732, 6.9040]
      },
      "pricing": {
        "monthlyRent": 25000,
        "securityDeposit": 50000
      },
      "images": ["url1", "url2"],
      "averageRating": 4.5,
      "totalReviews": 12
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true
  }
}
```

### Get Accommodation by ID
```http
GET /api/accommodations/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Comfortable Student Apartment",
    "description": "Fully furnished apartment...",
    "type": "apartment",
    "owner": {
      "_id": "owner-id",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "rooms": [
      {
        "_id": "room-id",
        "roomNumber": "101",
        "capacity": 1,
        "isAvailable": true
      }
    ],
    "facilities": ["wifi", "parking", "laundry"],
    "location": { ... },
    "pricing": { ... },
    "images": [],
    "averageRating": 4.5,
    "totalReviews": 12
  }
}
```

### Create Accommodation (Owner Only)

> **Note:** Listings are now automatically published when created. They appear in the public listings immediately without waiting for review.

```http
POST /api/accommodations
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Cozy Student Apartment",
  "description": "Perfect for SLIIT students...",
  "type": "apartment",
  "location": {
    "address": "123 Main Street",
    "city": "Malabe",
    "district": "Colombo",
    "postalCode": "10115",
    "coordinates": [79.9732, 6.9040]
  },
  "pricing": {
    "monthlyRent": 25000,
    "securityDeposit": 50000,
    "utilitiesIncluded": false
  },
  "facilities": ["wifi", "parking", "laundry"],
  "houseRules": {
    "petsAllowed": false,
    "smokingAllowed": false,
    "guestsAllowed": true
  }
}

Response: 201 Created
{
  "success": true,
  "message": "Accommodation listing published successfully",
  "data": {
    "_id": "accommodation-id",
    "title": "Cozy Student Apartment",
    "status": "active",
    "publishedAt": "2024-03-15T10:30:00Z",
    ... other fields
  }
}
```

### Update Accommodation (Owner Only)
```http
PUT /api/accommodations/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Updated Title",
  "pricing": {
    "monthlyRent": 28000
  }
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Upload Accommodation Images
```http
POST /api/accommodations/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
images: <file[]> (max 10 files)

Response: 200 OK
{
  "success": true,
  "data": {
    "images": ["/uploads/accommodations/img1.jpg", ...]
  }
}
```

### Delete Accommodation
```http
DELETE /api/accommodations/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Accommodation deleted successfully"
}
```

### Search Nearby Accommodations
```http
GET /api/accommodations/nearby
Query Parameters:
  - lat: number (latitude)
  - lng: number (longitude)
  - distance: number (in meters, default: 5000)

Example:
GET /api/accommodations/nearby?lat=6.9040&lng=79.9732&distance=3000

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "accommodation": { ... },
      "distance": 1234.56
    }
  ]
}
```

---

## 📅 Bookings

### Get My Bookings (Student)
```http
GET /api/bookings/my-bookings
Authorization: Bearer <token>
Query Parameters:
  - status: enum [pending, confirmed, cancelled, completed]
  - page: number
  - limit: number

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "_id": "booking-id",
      "room": { ... },
      "accommodation": { ... },
      "checkInDate": "2026-04-01",
      "checkOutDate": "2026-07-31",
      "status": "confirmed",
      "totalAmount": 75000
    }
  ]
}
```

### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "room": "room-id",
  "checkInDate": "2026-04-01",
  "checkOutDate": "2026-07-31",
  "numberOfOccupants": 1
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### Cancel Booking
```http
PUT /api/bookings/:id/cancel
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

---

## 💳 Payments

### Get Payment Details
```http
GET /api/payments/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "payment-id",
    "booking": { ... },
    "amount": 75000,
    "status": "completed",
    "method": "credit_card",
    "transactionId": "TXN123456"
  }
}
```

### Create Payment
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "booking": "booking-id",
  "amount": 75000,
  "method": "credit_card"
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

---

## ⭐ Reviews

### Get Reviews for Accommodation
```http
GET /api/accommodations/:id/reviews
Query Parameters:
  - page: number
  - limit: number
  - sort: string (default: -createdAt)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "_id": "review-id",
      "student": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "overallRating": 4.5,
      "categoryRatings": {
        "cleanliness": 5,
        "location": 4,
        "value": 4
      },
      "comment": "Great place!",
      "createdAt": "2026-03-15"
    }
  ]
}
```

### Create Review (Student Only)
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "accommodation": "accommodation-id",
  "overallRating": 4.5,
  "categoryRatings": {
    "cleanliness": 5,
    "location": 4,
    "value": 4,
    "amenities": 5,
    "communication": 5
  },
  "comment": "Great place! Highly recommended.",
  "images": ["url1", "url2"]
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### Update Review
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "overallRating": 5,
  "comment": "Updated review comment"
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## 🔧 Maintenance Tickets

### Get My Tickets (Student)
```http
GET /api/tickets/my-tickets
Authorization: Bearer <token>
Query Parameters:
  - status: enum [open, in_progress, resolved, closed]

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "_id": "ticket-id",
      "title": "Broken AC",
      "category": "electrical",
      "priority": "high",
      "status": "in_progress",
      "assignedProvider": { ... }
    }
  ]
}
```

### Create Ticket
```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "accommodation": "accommodation-id",
  "title": "Broken AC Unit",
  "description": "The AC is not cooling properly",
  "category": "electrical",
  "priority": "high"
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### Update Ticket Status (Service Provider)
```http
PUT /api/tickets/:id/status
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "in_progress",
  "notes": "Working on the issue"
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

---

## 🔔 Notifications

### Get My Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
Query Parameters:
  - unreadOnly: boolean
  - page: number
  - limit: number

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "_id": "notification-id",
      "type": "booking_update",
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed",
      "isRead": false,
      "createdAt": "2026-03-23T10:30:00Z"
    }
  ],
  "unreadCount": 5
}
```

### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 👨‍💼 Admin Endpoints

### Get All Users (Admin Only)
```http
GET /api/admin/users
Authorization: Bearer <token>
Query Parameters:
  - role: enum [student, owner, service_provider, admin]
  - accountStatus: enum [pending, active, suspended, deleted]
  - page: number
  - limit: number

Response: 200 OK
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

### Approve Owner Verification
```http
PUT /api/admin/owners/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "verificationStatus": "verified",
  "note": "All documents verified"
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Suspend User Account
```http
PUT /api/admin/users/:id/suspend
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "reason": "Violation of terms"
}

Response: 200 OK
{
  "success": true,
  "message": "User suspended successfully"
}
```

### Get Audit Logs
```http
GET /api/admin/audit-logs
Authorization: Bearer <token>
Query Parameters:
  - userId: string
  - action: string
  - entity: string
  - startDate: date
  - endDate: date
  - page: number
  - limit: number

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "user": { ... },
      "action": "create",
      "entity": "accommodation",
      "entityId": "...",
      "timestamp": "2026-03-23T10:30:00Z"
    }
  ]
}
```

---

## 📊 Response Codes

- `200` OK - Request successful
- `201` Created - Resource created successfully
- `400` Bad Request - Invalid input
- `401` Unauthorized - Authentication required
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Resource already exists
- `422` Unprocessable Entity - Validation failed
- `500` Internal Server Error - Server error

---

## 🚨 Error Response Format

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

**Last Updated:** March 2026
**API Version:** 1.0.0
