# 🏠 SLIIT Student Accommodation Management System — Full Project Task List

> **Tech Stack:** MongoDB · Express.js · React.js · Node.js (MERN)
> **Total Tasks:** 400+ | **Modules:** 7 | **Phases:** 6
> **Status Legend:** ⬜ Not Started · 🔲 In Progress · ✅ Done

## Recent Updates (2026-03-25)

- [x] Fixed booking submit failure for room-scope bookings when owner room types differ from accommodation-level room types.
- [x] Synced accommodation room snapshot from room records (total rooms, available rooms, room types) after room create/update/delete.
- [x] Added student-facing room media viewer in listing details to browse room photos and videos similarly to accommodation media.
- [x] Added room media fallback in student bookings list to show room image when available.
- [x] Added room management panel to edit listing page so owners can add and review multiple rooms in one flow.

## Recent Updates (2026-03-31)

- [x] Added dedicated owner page for provider bookings with tabbed statuses (pending, in progress, completed, rejected, cancelled).
- [x] Added owner-side provider booking edit and cancel actions with backend authorization and validation.
- [x] Added provider availability lifecycle so providers become unavailable when booked and available again when booking is completed/rejected/cancelled.
- [x] Synced booking date visibility across provider pending, in-progress, and completed views.
- [x] Removed provider dashboard shortcut button labeled "Go to My Tasks".

## Recent Updates (2026-04-03)

- [x] Fixed service provider approval so admin approval updates provider verification state and approved providers now appear in category-based provider lists.

## Recent Updates (2026-04-04)

- [x] Added all 25 Sri Lankan districts to the service provider search filter and booking district dropdown.
- [x] Added backend date validation to prevent booking service providers for past dates.
- [x] Added conflict detection endpoint to fetch booked dates for a specific provider.
- [x] Prevented double-booking: owners cannot book a date already booked by another person.
- [x] Enhanced booking modal with visual date availability indicators (red for booked by others, yellow for own bookings).
- [x] Added real-time date validation feedback in the service provider booking form with clear error messages.
- [x] Highlighted unbookable calendar dates in the booking date picker and blocked selecting dates already booked by other owners.
- [x] Kept service providers visible in category lists after bookings by removing global availability filtering from list queries.
- [x] Updated booking creation to use date-level conflict checks without globally marking providers unavailable.
- [x] Restricted maintenance ticket submission to completed accommodation bookings only.
- [x] Added owner dashboard shortcut to the tickets management page.
- [x] Kept owner ticket approval and rejection flow available from the dedicated tickets page.
- [x] Restored the owner ticket details modal and assignment handoff to maintenance categories after the undo.

---

## 📌 Table of Contents

- [Phase 0 — Project Initialization & Setup](#phase-0--project-initialization--setup)
- [Phase 1 — Module 1: Authentication & User Management](#phase-1--module-1-authentication--user-management)
- [Phase 2 — Module 2: Accommodation Management](#phase-2--module-2-accommodation-management)
- [Phase 3 — Module 3: Booking & Search Management](#phase-3--module-3-booking--search-management)
- [Phase 4 — Module 4: Reviews & AI Summary](#phase-4--module-4-reviews--ai-summary)
- [Phase 5 — Module 5: Payment Management](#phase-5--module-5-payment-management)
- [Phase 6 — Module 6: Maintenance & Support](#phase-6--module-6-maintenance--support)
- [Phase 7 — Module 7: Admin Panel](#phase-7--module-7-admin-panel)
- [Phase 8 — Notifications System (Cross-Cutting)](#phase-8--notifications-system-cross-cutting)
- [Phase 9 — Testing, Deployment & Documentation](#phase-9--testing-deployment--documentation)

---

---

# Phase 0 — Project Initialization & Setup

## 0.1 Repository & Folder Structure

- [x] Create GitHub repository `sliit-accommodation-system`
- [x] Initialize monorepo structure:
  ```
  /
  ├── client/          (React frontend)
  ├── server/          (Express backend)
  ├── docs/            (Documentation)
  └── README.md
  ```
- [x] Create `.gitignore` (node_modules, .env, build, uploads)
- [x] Create `README.md` with project overview
- [x] Set up branch strategy (main, develop, feature/\*)

## 0.2 Backend Initialization (server/)

- [x] `cd server && npm init -y`
- [x] Install core dependencies:
  ```bash
  npm install express mongoose dotenv cors helmet morgan
  npm install bcryptjs jsonwebtoken cookie-parser
  npm install express-validator multer nodemailer
  npm install express-rate-limit
  ```
- [x] Install dev dependencies:
  ```bash
  npm install -D nodemon jest supertest
  ```
- [x] Create backend folder structure:
  ```
  server/
  ├── config/
  │   ├── db.js                 # MongoDB connection
  │   └── env.js                # Environment config
  ├── models/                   # Mongoose schemas (18 models)
  │   ├── User.js
  │   ├── Student.js
  │   ├── Owner.js
  │   ├── ServiceProvider.js
  │   ├── Admin.js
  │   ├── Accommodation.js
  │   ├── Room.js
  │   ├── Booking.js
  │   ├── Payment.js
  │   ├── Invoice.js
  │   ├── Review.js
  │   ├── AIReviewSummary.js
  │   ├── MaintenanceTicket.js
  │   ├── Notification.js
  │   ├── ListingReport.js
  │   ├── Inquiry.js
  │   ├── NotificationTemplate.js
  │   └── AuditLog.js
  ├── routes/
  │   ├── auth.routes.js
  │   ├── user.routes.js
  │   ├── accommodation.routes.js
  │   ├── room.routes.js
  │   ├── booking.routes.js
  │   ├── payment.routes.js
  │   ├── invoice.routes.js
  │   ├── review.routes.js
  │   ├── aiSummary.routes.js
  │   ├── ticket.routes.js
  │   ├── notification.routes.js
  │   ├── inquiry.routes.js
  │   ├── favorite.routes.js
  │   ├── report.routes.js
  │   └── admin.routes.js
  ├── controllers/
  │   ├── auth.controller.js
  │   ├── user.controller.js
  │   ├── accommodation.controller.js
  │   ├── room.controller.js
  │   ├── booking.controller.js
  │   ├── payment.controller.js
  │   ├── invoice.controller.js
  │   ├── review.controller.js
  │   ├── aiSummary.controller.js
  │   ├── ticket.controller.js
  │   ├── notification.controller.js
  │   ├── inquiry.controller.js
  │   ├── favorite.controller.js
  │   ├── report.controller.js
  │   └── admin.controller.js
  ├── middleware/
  │   ├── auth.middleware.js      # JWT verification
  │   ├── role.middleware.js      # Role-based access
  │   ├── validate.middleware.js  # Request validation
  │   ├── upload.middleware.js    # Multer file upload
  │   └── error.middleware.js     # Global error handler
  ├── utils/
  │   ├── email.util.js           # Nodemailer helper
  │   ├── token.util.js           # JWT helpers
  │   ├── pagination.util.js      # Pagination helper
  │   ├── auditLog.util.js        # Audit logging helper
  │   └── notification.util.js    # Notification dispatch
  ├── validators/
  │   ├── auth.validator.js
  │   ├── accommodation.validator.js
  │   ├── booking.validator.js
  │   ├── review.validator.js
  │   └── ticket.validator.js
  ├── server.js                   # Entry point
  └── .env
  ```
- [x] Create `server.js` — Express app setup with middleware
- [x] Create `config/db.js` — MongoDB connection with Mongoose
- [x] Create `.env` file:
  ```env
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/sliit_accommodation_db
  JWT_SECRET=your_jwt_secret_key
  JWT_REFRESH_SECRET=your_refresh_secret
  JWT_EXPIRE=1h
  JWT_REFRESH_EXPIRE=7d
  EMAIL_HOST=smtp.gmail.com
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASS=your_app_password
  CLIENT_URL=http://localhost:3000
  ```
- [x] Create global error handler middleware
- [ ] Test server starts: `npm run dev` → `Server running on port 5000`
- [ ] Test MongoDB connection → `MongoDB Connected`

## 0.3 Frontend Initialization (client/)

- [x] `npx create-react-app client` or `npm create vite@latest client -- --template react`
- [x] Install core dependencies:
  ```bash
  npm install react-router-dom axios
  npm install @reduxjs/toolkit react-redux
  npm install react-hook-form react-toastify
  npm install react-icons lucide-react
  npm install tailwindcss @tailwindcss/forms postcss autoprefixer
  ```
- [x] Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`)
- [x] Create frontend folder structure:
  ```
  client/src/
  ├── api/
  │   └── axios.js               # Axios instance with interceptors
  ├── app/
  │   └── store.js               # Redux store
  ├── features/
  │   ├── auth/
  │   │   ├── authSlice.js
  │   │   └── authAPI.js
  │   ├── accommodations/
  │   ├── bookings/
  │   ├── payments/
  │   ├── reviews/
  │   ├── tickets/
  │   ├── notifications/
  │   └── admin/
  ├── components/
  │   ├── common/                # Reusable UI components
  │   │   ├── Navbar.jsx
  │   │   ├── Footer.jsx
  │   │   ├── Sidebar.jsx
  │   │   ├── LoadingSpinner.jsx
  │   │   ├── Pagination.jsx
  │   │   ├── Modal.jsx
  │   │   ├── ConfirmDialog.jsx
  │   │   ├── FileUpload.jsx
  │   │   ├── StarRating.jsx
  │   │   └── StatusBadge.jsx
  │   ├── auth/
  │   ├── accommodation/
  │   ├── booking/
  │   ├── payment/
  │   ├── review/
  │   ├── ticket/
  │   ├── notification/
  │   └── admin/
  ├── pages/
  │   ├── public/
  │   │   ├── HomePage.jsx
  │   │   ├── LoginPage.jsx
  │   │   ├── RegisterPage.jsx
  │   │   ├── SearchPage.jsx
  │   │   └── ListingDetailPage.jsx
  │   ├── student/
  │   │   ├── StudentDashboard.jsx
  │   │   ├── MyBookingsPage.jsx
  │   │   ├── FavoritesPage.jsx
  │   │   ├── MyTicketsPage.jsx
  │   │   └── ProfilePage.jsx
  │   ├── owner/
  │   │   ├── OwnerDashboard.jsx
  │   │   ├── MyListingsPage.jsx
  │   │   ├── CreateListingPage.jsx
  │   │   ├── EditListingPage.jsx
  │   │   ├── TenantManagementPage.jsx
  │   │   ├── BookingRequestsPage.jsx
  │   │   └── OwnerTicketsPage.jsx
  │   ├── provider/
  │   │   ├── ProviderDashboard.jsx
  │   │   └── MyTasksPage.jsx
  │   └── admin/
  │       ├── AdminDashboard.jsx
  │       ├── UserManagementPage.jsx
  │       ├── ListingModerationPage.jsx
  │       ├── ReportsPage.jsx
  │       ├── TransactionsPage.jsx
  │       ├── TicketEscalationsPage.jsx
  │       ├── NotificationConsolePage.jsx
  │       └── AuditLogPage.jsx
  ├── hooks/
  │   ├── useAuth.js
  │   ├── useDebounce.js
  │   └── useNotifications.js
  ├── utils/
  │   ├── formatters.js           # Date, currency formatters
  │   ├── validators.js           # Client-side validation
  │   └── constants.js            # Enums, config constants
  ├── layouts/
  │   ├── PublicLayout.jsx
  │   ├── StudentLayout.jsx
  │   ├── OwnerLayout.jsx
  │   ├── ProviderLayout.jsx
  │   └── AdminLayout.jsx
  ├── routes/
  │   ├── AppRouter.jsx
  │   ├── PrivateRoute.jsx
  │   └── RoleRoute.jsx
  ├── App.jsx
  └── index.jsx
  ```
- [x] Set up Axios instance with base URL + JWT interceptor
- [x] Set up Redux store with auth slice
- [x] Set up React Router with public/private/role routes
- [ ] Create layout components (Public, Student, Owner, Provider, Admin)
- [ ] Create reusable UI components (Navbar, Footer, Spinner, Modal, Pagination)
- [ ] Test: `npm start` → React app running on `http://localhost:3000`

## 0.4 Database Setup

- [x] Create all 18 Mongoose model files from `DATABASE_MODLES.txt`
- [x] Set up User discriminators (Student, Owner, ServiceProvider, Admin)
- [x] Verify all indexes are created (2dsphere, text, compound, TTL, unique)
- [ ] Create database seeder script (`server/seeds/seed.js`)
- [ ] Run seeder → verify sample data in MongoDB Compass

## 0.5 Shared Middleware & Utilities

- [x] Create `auth.middleware.js` — JWT token verification
- [x] Create `role.middleware.js` — `authorize('student', 'owner', 'admin')`
- [x] Create `validate.middleware.js` — express-validator wrapper
- [x] Create `upload.middleware.js` — Multer config (images, videos, docs)
- [x] Create `error.middleware.js` — global error handler with status codes
- [x] Create `email.util.js` — Nodemailer transporter + send function
- [x] Create `token.util.js` — generateAccessToken, generateRefreshToken, verifyToken
- [x] Create `pagination.util.js` — paginate(model, query, options)
- [x] Create `auditLog.util.js` — logAction(userId, action, entity, details)
- [x] Create `notification.util.js` — createNotification(recipient, type, data)

---

---

# Phase 1 — Module 1: Authentication & User Management

## 1.1 Backend — Models

- [ ] `models/User.js` — Base user schema with discriminator key
- [ ] `models/Student.js` — Student discriminator (sliitEmail, studentId, batch, faculty, favorites)
- [ ] `models/Owner.js` — Owner discriminator (nic, bankDetails, verificationDocuments)
- [ ] `models/ServiceProvider.js` — Provider discriminator (serviceCategories, areasOfOperation, certifications)
- [ ] `models/Admin.js` — Admin discriminator (adminLevel, permissions, 2FA)

## 1.2 Backend — Auth APIs

### `POST /api/auth/register/student`

- [ ] Route: `routes/auth.routes.js`
- [ ] Validator: validate SLIIT email regex, password strength, required fields
- [ ] Controller: hash password, create Student, generate verification token, send email
- [ ] Test with Postman → 201 Created

### `POST /api/auth/register/owner`

- [ ] Route definition
- [ ] Validator: validate NIC, email, required fields
- [ ] Controller: hash password, create Owner, handle document upload, send verification email
- [ ] Test → 201 Created

### `POST /api/auth/register/service-provider`

- [x] Route definition
- [x] Validator: validate NIC, serviceCategories enum, required fields
- [x] Controller: create ServiceProvider with status "pending"
- [x] Fix: normalize `serviceCategories`, `areasOfOperation`, and `certifications` payloads to schema shape
- [ ] Controller: notify admin
- [ ] Test → 201 Created

### `POST /api/auth/login`

- [ ] Route definition
- [ ] Validator: email + password required
- [ ] Controller: find user, compare password, check email verified, check account status, generate JWT + refresh token, update lastLogin
- [ ] Test → 200 with tokens

### `POST /api/auth/refresh-token`

- [ ] Route definition
- [ ] Controller: verify refresh token, generate new access token
- [ ] Test → 200 with new access token

### `POST /api/auth/logout`

- [ ] Route definition (protected)
- [ ] Controller: invalidate refresh token
- [ ] Test → 200 Logged out

### `POST /api/auth/forgot-password`

- [ ] Route definition
- [ ] Controller: find by email, generate reset token, save, send email
- [ ] Test → 200 Reset link sent

### `POST /api/auth/reset-password/:token`

- [ ] Route definition
- [ ] Controller: verify token, hash new password, update, clear token
- [ ] Test → 200 Password reset

## 1.3 Backend — User Profile APIs

### `GET /api/users/profile`

- [ ] Route (protected: any authenticated user)
- [ ] Controller: return user with role-specific populated fields
- [ ] Test → 200 with full profile

### `PUT /api/users/profile`

- [ ] Route (protected)
- [ ] Controller: update allowed fields (name, phone, address, profileImage)
- [ ] Handle profile image upload with Multer
- [ ] Test → 200 Updated

### `PUT /api/users/change-password`

- [ ] Route (protected)
- [ ] Controller: verify current password, hash + update new password
- [ ] Test → 200 Changed

### `PUT /api/users/notification-preferences`

- [ ] Route (protected)
- [ ] Controller: update notificationPreferences subdocument
- [ ] Test → 200 Updated

## 1.4 Frontend — Auth Pages

### Register Pages

- [ ] `components/auth/StudentRegisterForm.jsx` — SLIIT email field, student ID, batch, faculty
- [ ] `components/auth/OwnerRegisterForm.jsx` — NIC, bank details, document upload
- [ ] `components/auth/ProviderRegisterForm.jsx` — service categories, area of operation
- [x] `components/auth/ServiceProviderRegisterForm.jsx` — service categories, area of operation, payload mapping fix
- [x] `components/auth/ServiceProviderRegisterForm.jsx` — remove business/certification fields; add main category + district + area + profile note
- [x] `components/auth/ServiceProviderRegisterForm.jsx` — add provider photo input + preview on registration
- [ ] `pages/public/RegisterPage.jsx` — tab/step switcher for 3 registration types
- [ ] Form validation (react-hook-form)
- [ ] API integration (authAPI.js → register endpoints)
- [ ] Success toast + redirect to login
- [ ] Error handling (duplicate email, invalid SLIIT format)

### Login Page

- [ ] `pages/public/LoginPage.jsx` — email + password form
- [ ] API integration → store tokens in Redux + localStorage
- [ ] Redirect by role (student→dashboard, owner→dashboard, admin→admin panel)
- [ ] Forgot password link → modal/page

### Forgot & Reset Password

- [ ] `components/auth/ForgotPasswordModal.jsx` — email input → API call
- [ ] `pages/public/ResetPasswordPage.jsx` — token from URL, new password form

### Email Verification

- [ ] `pages/public/VerifyEmailPage.jsx` — extract token from URL, call verify API

### Profile Page

- [ ] `pages/student/ProfilePage.jsx` (also used by owner/provider with role checks)
- [ ] Display profile info with edit mode
- [ ] Profile image upload with preview
- [ ] Change password section
- [ ] Notification preferences toggles (email, in-app, SMS, WhatsApp)
- [ ] API integration for GET profile, PUT update, PUT change-password, PUT preferences

## 1.5 Frontend — Auth State & Routing

- [ ] `features/auth/authSlice.js` — login, logout, register, loadUser actions
- [ ] `features/auth/authAPI.js` — all auth API calls
- [ ] `api/axios.js` — interceptor: attach token, handle 401 → auto refresh
- [ ] `routes/PrivateRoute.jsx` — redirect to login if not authenticated
- [ ] `routes/RoleRoute.jsx` — restrict by role (student, owner, provider, admin)
- [ ] `hooks/useAuth.js` — custom hook returning user, isAuthenticated, role

---

---

# Phase 2 — Module 2: Accommodation Management

## 2.1 Backend — Models

- [x] `models/Accommodation.js` — Full schema with GeoJSON, text index, all embedded objects
- [x] `models/Room.js` — Room schema with accommodation ref

## 2.2 Backend — Accommodation APIs

### `POST /api/accommodations`

- [x] Route (protected: owner)
- [x] Validator: required fields (title, description, type, location, pricing)
- [x] Controller: create listing with owner ref, handle photo/video uploads, set status=draft
- [x] Test → 201 Created

### `GET /api/accommodations`

- [x] Route (public)
- [x] Controller: build filter query from query params (keyword, city, price range, gender, roomType, facilities, distance, billsIncluded, minimumPeriod, accommodationType)
- [x] Implement text search ($text)
- [x] Implement geospatial query ($near with coordinates)
- [x] Implement sort (price_asc, price_desc, nearest, rating, newest)
- [x] Implement pagination (page, limit)
- [x] Populate owner (firstName, lastName)
- [x] Test with various filter combinations

### `GET /api/accommodations/:id`

- [x] Route (public)
- [x] Controller: findById, populate owner, fetch rooms, fetch approved reviews, fetch AI summary
- [x] Increment viewCount
- [x] Test → 200 with full details

### `PUT /api/accommodations/:id`

- [x] Route (protected: listing owner only)
- [x] Middleware: verify req.user.\_id === accommodation.owner
- [x] Controller: update fields, handle new photo uploads, handle removePhotos array
- [x] Test → 200 Updated

### `PATCH /api/accommodations/:id/publish`

- [x] Route (protected: owner)
- [x] Controller: set status to pending_review or active
- [x] Test → 200

### `PATCH /api/accommodations/:id/unpublish`

- [x] Route (protected: owner)
- [x] Controller: set status to unpublished
- [x] Test → 200

### `DELETE /api/accommodations/:id`

- [x] Route (protected: owner/admin)
- [x] Controller: check no active bookings, soft delete
- [x] Test → 200 / 409

### `GET /api/accommodations/owner/my-listings`

- [x] Route (protected: owner)
- [x] Controller: find by owner with status filter, return stats (total, active, draft, pending)
- [x] Test → 200

## 2.3 Backend — Room APIs

### `POST /api/accommodations/:accommodationId/rooms`

- [x] Route (protected: listing owner)
- [x] Controller: create room linked to accommodation, update totalRooms/availableRooms
- [x] Test → 201

### `GET /api/accommodations/:accommodationId/rooms`

- [x] Route (protected: owner/admin)
- [x] Controller: find rooms by accommodation, populate currentTenants
- [x] Test → 200

### `PUT /api/rooms/:roomId`

- [x] Route (protected: owner)
- [x] Controller: update room fields
- [x] Test → 200

### `DELETE /api/rooms/:roomId`

- [x] Route (protected: owner)
- [x] Controller: check not occupied, delete, update counts
- [x] Test → 200 / 409

## 2.4 Backend — Tenant Management APIs

### `GET /api/accommodations/:id/tenants`

- [x] Route (protected: owner)
- [x] Controller: find confirmed bookings, populate student + room + payment status
- [x] Test → 200

### `PATCH /api/bookings/:bookingId/assign-room`

- [x] Route (protected: owner)
- [x] Controller: verify room available, assign to booking, update room status + currentTenants
- [x] Test → 200

### `POST /api/accommodations/:id/notices`

- [x] Route (protected: owner)
- [x] Controller: find all active tenants, create notification for each
- [x] Test → 200

### `GET /api/users/tenant-notices`

- [x] Route (protected: student)
- [x] Controller: fetch tenant notices (owner-sent accommodation notices) for logged-in student
- [x] Test → 200

## 2.5 Frontend — Owner Accommodation Pages

### Create Listing Page

- [x] `pages/owner/CreateListingPage.jsx` — Multi-step form:
  - [x] Step 1: Basic Info (title, description, type)
  - [x] Step 2: Location (district dropdown, city, address, map pin with Google Maps / Leaflet)
  - [x] Step 3: Room Types & Pricing (monthlyRent, keyMoney, deposit, bills)
  - [x] Step 4: Facilities (checkbox grid — WiFi, furniture, kitchen, etc.)
  - [x] Step 5: House Rules (gender, visitors, smoking, pets, quiet hours)
  - [x] Step 6: Photos & Videos upload (drag-drop, preview, set primary)
  - [x] Step 7: Booking Rules (minimum period, cancellation policy)
  - [x] Step 8: Review & Publish (summary + publish/save draft buttons)
- [x] Form validation per step
- [x] API integration → POST /api/accommodations + file upload
- [x] Success redirect to My Listings

### Edit Listing Page

- [x] `pages/owner/EditListingPage.jsx` — Pre-filled form from GET /:id
- [x] Photo management (add new, remove existing)
- [x] API integration → PUT /api/accommodations/:id

### My Listings Page

- [x] `pages/owner/MyListingsPage.jsx`
- [x] Status filter tabs (All, Active, Draft, Pending, Frozen)
- [x] Listing cards with status badges, view count, booking count
- [x] Actions: Edit, Publish/Unpublish, Delete
- [x] Stats summary header (total, active, draft, pending)
- [x] Keep listing availability fresh with periodic background refresh + window-focus refresh (reflect booking-driven room count updates)

### Room Management (within listing)

- [x] `components/accommodation/RoomManager.jsx`
- [x] Add room form (roomNumber, type, floor, rent, facilities)
- [x] Room list with status badges
- [x] Edit/Delete room actions
- [x] Room media upload support (owner can upload room photos/videos)
- [x] Room media preview shown on room cards in manage rooms

### Tenant Management Page

- [x] `pages/owner/TenantManagementPage.jsx`
- [x] Accommodation selector dropdown
- [x] Tenant list with student info, room, contract period, payment status
- [x] Assign room action (for confirmed bookings without room)
- [x] Send notice button → notice form modal
- [x] Student dashboard notice panel shows owner notices for tenant accommodations

## 2.6 Frontend — Public Search & Listing Pages

### Search/Browse Page

- [x] `pages/public/SearchPage.jsx`
- [x] Search bar with keyword input
- [x] Filter panel (sidebar or collapsible):
  - [x] Monthly fee range (min-max slider or dropdowns)
  - [x] Gender allowed (Boys/Girls/Mixed radio)
  - [x] Room type checkboxes (Single/Double/Shared)
  - [x] Distance to campus range
  - [x] Facilities checkboxes (WiFi, Furnished, A/C, Bathroom, Kitchen)
  - [x] Bills included toggle
  - [x] Minimum period dropdown
  - [x] Accommodation type dropdown
- [x] Sort dropdown (Lowest Price, Nearest, Rating, Newest)
- [x] Results grid/list view toggle
- [x] Listing cards with: primary photo, title, price, location, gender badge, rating, facilities icons
- [x] Pagination
- [x] "No results" state with suggestions
- [x] API integration → GET /api/accommodations with query params

### Listing Detail Page

- [x] `pages/public/ListingDetailPage.jsx`
- [x] Photo gallery (carousel/lightbox)
- [x] Info sections: Type, Location (with map), Pricing breakdown, Facilities, House Rules, Booking Rules
- [x] Availability status badge
- [x] Owner info card (name, phone — conditional on auth)
- [x] Action buttons: Book Now, Contact Owner, Save/Favorite, Report
- [x] Reviews section: average rating, sentiment label, AI summary, individual reviews with pagination
- [x] API integration → GET /api/accommodations/:id

## 2.7 Frontend — State Management

- [x] `features/accommodations/accommodationSlice.js` — list, single, myListings, filters
- [x] `features/accommodations/accommodationAPI.js` — all accommodation API calls
- [x] `features/rooms/roomSlice.js` + `roomAPI.js`

---

---

# Phase 3 — Module 3: Booking & Search Management

## 3.1 Backend — Models

- [x] `models/Booking.js` — Full schema with costSummary, status enum, paymentStatus
- [x] `models/Inquiry.js` — Communication schema with messages array

## 3.2 Backend — Booking APIs

### `POST /api/bookings`

- [x] Route (protected: student)
- [x] Validator: accommodationId, roomType, checkInDate, contractPeriod
- [x] Controller: verify accommodation available, generate bookingNumber, calculate costSummary, create booking, send email to owner + student, create notifications
- [x] Controller: reserve an accommodation slot on booking creation and maintain slot release on reject/cancel/complete transitions
- [x] Support dual booking scope (`accommodation` or specific `room`) with `roomId`
- [x] Validate room-level availability (room status + active booking capacity) before creating room bookings
- [ ] Test → 201

### `GET /api/bookings`

- [x] Route (protected: student/owner)
- [x] Controller: if student → find by student, if owner → find by owner, with status filter + pagination
- [x] Populate accommodation (title, location, photo), student/owner info
- [x] Owner filter by `accommodationId` query (view student bookings per specific listing)
- [ ] Test → 200

### `GET /api/bookings/:id`

- [x] Route (protected: own booking or own property)
- [x] Controller: findById, populate all refs, fetch payments + invoices for this booking
- [ ] Test → 200

### `PATCH /api/bookings/:id`

- [x] Route (protected: student)
- [x] Validator: optional editable fields (roomType, checkInDate, contractPeriod, specialRequests, emergencyContact)
- [x] Controller: verify student owns booking, allow update only in pending status, recalculate checkOutDate
- [ ] Test → 200

### `PATCH /api/bookings/:id/accept`

- [x] Route (protected: owner)
- [x] Controller: verify pending status, set confirmed, generate initial invoice, send email to student, create notifications
- [ ] Test → 200

### `PATCH /api/bookings/:id/reject`

- [x] Route (protected: owner)
- [x] Controller: set rejected + rejectionReason, send email to student
- [ ] Test → 200

### `PATCH /api/bookings/:id/cancel`

- [x] Route (protected: student/owner)
- [x] Controller: pending-only cancel; set cancelled + reason + cancelledBy, calculate refund eligibility, send notifications
- [ ] Test → 200

### `PATCH /api/bookings/:id/complete`

- [x] Route (protected: owner/admin)
- [x] Controller: verify contract period ended, set completed
- [ ] Test → 200

## 3.3 Backend — Favorites APIs

### `POST /api/favorites/:accommodationId`

- [x] Route (protected: student)
- [x] Controller: push to student.favorites if not exists
- [ ] Test → 200

### `DELETE /api/favorites/:accommodationId`

- [x] Route (protected: student)
- [x] Controller: pull from student.favorites
- [ ] Test → 200

### `GET /api/favorites`

- [x] Route (protected: student)
- [x] Controller: find student, populate favorites array
- [ ] Test → 200

## 3.4 Backend — Inquiry/Communication APIs

### `POST /api/inquiries`

- [x] Route (protected: student)
- [x] Controller: create inquiry with first message, notify owner
- [ ] Test → 201

### `GET /api/inquiries`

- [x] Route (protected: student/owner)
- [x] Controller: find by student or owner, populate refs, return last message preview
- [ ] Test → 200

### `POST /api/inquiries/:inquiryId/messages`

- [x] Route (protected: student/owner — participants only)
- [x] Controller: push message to messages array, notify recipient
- [ ] Test → 201

### `PATCH /api/inquiries/:inquiryId/close`

- [x] Route (protected: student/owner)
- [x] Controller: set status=closed
- [ ] Test → 200

## 3.5 Frontend — Student Booking Pages

### Booking Flow (on Listing Detail Page)

- [x] `components/booking/BookingForm.jsx`
  - [x] Booking type selector (book entire accommodation vs specific room)
  - [x] Available room selector with slot counts for room-based bookings
  - [x] Room type selector
  - [x] Check-in date picker
  - [x] Contract period dropdown
  - [x] Cost summary display (auto-calculated: rent + keyMoney + deposit)
  - [x] Special requests textarea
  - [x] Emergency contact fields
  - [x] Frontend validations: required fields, date checks, 10-digit emergency contact, and room availability checks
  - [x] Submit booking button
- [x] API integration → POST /api/bookings
- [x] Success modal with booking number
- [x] Listing detail gate: disable booking action when neither accommodation slots nor room slots are available
- [x] Listing detail room cards show room-level image/video availability
- [x] Student can directly click a specific room card and prefill room booking

### My Bookings Page

- [x] `pages/student/MyBookingsPage.jsx`
- [x] Status filter tabs (All, Pending, Confirmed, Cancelled, Completed)
- [x] Booking cards: accommodation thumbnail, booking number, status badge, dates, cost
- [x] Click → booking detail page
- [x] Update booking button next to View Booking (pending bookings only)
- [x] Update modal with room type, check-in date, contract period, special requests, and emergency contact
- [x] Cancel booking button (with reason modal)

### Booking Detail Page

- [x] `components/booking/BookingDetail.jsx`
- [x] Full booking info: accommodation, room, dates, cost breakdown
- [x] Status timeline (Pending → Confirmed → Completed)
- [x] Payment history table
- [x] Actions: Cancel, Pay Now (link to payment), Write Review (if completed)

### Owner — Booking Requests Page

- [x] `pages/owner/BookingRequestsPage.jsx`
- [x] Filter by accommodation + status
- [x] Request cards: student info, accommodation, room type, dates, cost
- [x] Accept / Reject buttons (reject → reason modal)
- [x] Auto-generate invoice on accept
- [x] Fetch bookings using backend accommodation-level query filter (not only client-side filtering)
- [x] Query-param deep links (`accommodationId`, `status`) for listing-specific booking views
- [x] Owner dashboard integration with quick access to booking requests

### Favorites Page

- [x] `pages/student/FavoritesPage.jsx`
- [x] Grid of saved listings with remove button
- [x] Click → listing detail
- [x] Heart icon toggle on listing cards (across SearchPage + DetailPage)

### Inquiry / Chat

- [x] `components/inquiry/InquiryList.jsx` — list of conversations
- [x] `components/inquiry/ChatWindow.jsx` — message thread with send input
- [x] `components/inquiry/ContactOwnerModal.jsx` — choose method (in-app/WhatsApp/form)
- [x] WhatsApp deep link generation (wa.me/phone?text=...)
- [x] API integration for all inquiry endpoints

## 3.6 Frontend — State Management

- [x] `features/bookings/bookingSlice.js` + `bookingAPI.js`
- [x] `features/favorites/favoriteSlice.js` + `favoriteAPI.js`
- [x] `features/inquiries/inquirySlice.js` + `inquiryAPI.js`

---

---

# Phase 4 — Module 4: Reviews & AI Summary

## 4.1 Backend — Models

- [ ] `models/Review.js` — Rating schema with categories, moderation, unique per student+booking
- [ ] `models/AIReviewSummary.js` — AI summary with sentiment, keywords, themes

## 4.2 Backend — Review APIs

### `POST /api/reviews`

- [ ] Route (protected: student)
- [ ] Validator: accommodationId, bookingId, overallRating (1-5), content (min 10 chars)
- [ ] Controller: verify booking belongs to student + completed/active, check no duplicate, create with pending_approval status
- [ ] Test → 201

### `GET /api/reviews/accommodation/:accommodationId`

- [ ] Route (public)
- [ ] Controller: find approved reviews, populate student, sort + paginate, calculate rating distribution
- [ ] Test → 200

### `PUT /api/reviews/:id`

- [ ] Route (protected: student — own only)
- [ ] Controller: update rating/content, reset to pending_approval
- [ ] Test → 200

### `DELETE /api/reviews/:id`

- [ ] Route (protected: student own / admin)
- [ ] Controller: delete, trigger rating recalculation
- [ ] Test → 200

### `POST /api/reviews/:id/helpful`

- [ ] Route (protected: student)
- [ ] Controller: increment helpfulCount (idempotent per user — can use a Set or separate collection)
- [ ] Test → 200

## 4.3 Backend — AI Summary APIs

### `GET /api/ai-summaries/:accommodationId`

- [ ] Route (public)
- [ ] Controller: findOne by accommodation
- [ ] Test → 200

### `POST /api/ai-summaries/:accommodationId/regenerate`

- [ ] Route (protected: admin)
- [ ] Controller: fetch all approved reviews, call AI analysis function (keyword extraction, sentiment scoring, summary generation), upsert AIReviewSummary, update accommodation.ratingsSummary
- [ ] Implement AI summary logic (OpenAI API or rule-based keyword analysis)
- [ ] Test → 200

## 4.4 Frontend — Review Components

### Review Section (on Listing Detail Page)

- [ ] `components/review/ReviewSummaryCard.jsx` — average rating, star bars, sentiment badge, AI summary
- [ ] `components/review/ReviewList.jsx` — individual review cards with pagination
- [ ] `components/review/ReviewCard.jsx` — student name, rating, date, content, helpful button
- [ ] `components/review/WriteReviewForm.jsx` — star rating input (overall + categories), textarea, submit

### Review Integration

- [ ] Show "Write a Review" button only for completed/active bookings
- [ ] API calls: POST review, GET reviews, POST helpful
- [ ] Toast notifications on submit/error

## 4.5 Frontend — State

- [ ] `features/reviews/reviewSlice.js` + `reviewAPI.js`

---

---

# Phase 5 — Module 5: Payment Management

## 5.1 Backend — Models

- [ ] `models/Payment.js` — Full schema with gateway details, refund tracking
- [ ] `models/Invoice.js` — Invoice schema with line items, recurring support

## 5.2 Backend — Payment APIs

### `POST /api/payments/initiate`

- [ ] Route (protected: student)
- [ ] Controller: find invoice, verify unpaid, create Payment with status=processing, integrate with payment gateway (Stripe/PayHere), return redirect URL or client secret
- [ ] Test → 200

### `POST /api/payments/webhook/:gateway`

- [ ] Route (public — gateway signature verification)
- [ ] Controller: verify signature, find payment by gatewayTransactionId, update status, generate receipt, send email, update booking.paymentStatus
- [ ] Test with gateway sandbox

### `GET /api/payments`

- [ ] Route (protected: student/owner)
- [ ] Controller: find by paidBy (student) or paidTo (owner), with filters + pagination
- [ ] Test → 200

### `GET /api/payments/:id`

- [ ] Route (protected: own payment)
- [ ] Controller: findById, populate booking + user refs
- [ ] Test → 200

### `GET /api/payments/:id/receipt`

- [ ] Route (protected)
- [ ] Controller: generate PDF receipt or return receiptUrl
- [ ] Test → PDF download

### `POST /api/payments/:paymentId/refund`

- [ ] Route (protected: admin)
- [ ] Controller: verify amount <= original, call gateway refund, update payment status, send notifications
- [ ] Test → 200

## 5.3 Backend — Invoice APIs

### `GET /api/invoices`

- [ ] Route (protected: student/owner)
- [ ] Controller: find by student or booking.owner, filter by status + booking
- [ ] Test → 200

### `GET /api/invoices/:id`

- [ ] Route (protected)
- [ ] Controller: findById with populated refs
- [ ] Test → 200

### Auto Invoice Generation (internal)

- [ ] Create utility: `generateMonthlyInvoices()` — cron job or on-demand
- [ ] Find all confirmed bookings → generate next month invoice
- [ ] Set up monthly cron with node-cron or agenda

## 5.4 Frontend — Payment Pages

### Payment Flow

- [ ] `components/payment/InvoiceCard.jsx` — invoice number, amount, due date, status, Pay Now button
- [ ] `components/payment/PaymentGateway.jsx` — gateway selection (Stripe/PayHere), redirect handling
- [ ] `pages/student/PaymentSuccessPage.jsx` — post-payment redirect confirmation
- [ ] `pages/student/PaymentFailedPage.jsx` — error + retry

### Payment History

- [ ] `components/payment/PaymentHistory.jsx` — table with filters (status, type, date range)
- [ ] `components/payment/PaymentDetail.jsx` — full payment info + download receipt
- [ ] Integrate into Student Dashboard + Booking Detail Page

### Invoices View

- [ ] `components/payment/InvoiceList.jsx` — table with status badges (sent, paid, overdue)
- [ ] Overdue invoices highlighted in red
- [ ] API integration for all payment/invoice endpoints

## 5.5 Frontend — State

- [ ] `features/payments/paymentSlice.js` + `paymentAPI.js`
- [ ] `features/invoices/invoiceSlice.js` + `invoiceAPI.js`

---

---

# Phase 6 — Module 6: Maintenance & Support 

## 6.1 Backend — Models

- [x] `models/MaintenanceTicket.js` — Full schema with statusHistory, SLA, completion, ratings

## 6.2 Backend — Ticket APIs

### `POST /api/tickets`

- [x] Route (protected: student — confirmed booking required)
- [x] Validator: accommodationId, category, title, description
- [x] Controller: generate ticketNumber, create with status=open, calculate SLA deadlines, send notification to owner
- [ ] Test → 201

### `GET /api/tickets`

- [x] Route (protected: student/owner/provider)
- [x] Controller: role-based query (student=createdBy, owner=owner, provider=assignedProvider), with status/priority/category filters + pagination
- [x] Return stats (open, inProgress, completed counts)
- [ ] Test → 200

### `GET /api/tickets/:id`

- [x] Route (protected: participants)
- [x] Controller: findById, populate all refs, include statusHistory
- [ ] Test → 200

### `PATCH /api/tickets/:id/approve`

- [x] Route (protected: owner)
- [x] Controller: set status=approved, push to statusHistory
- [ ] Test → 200

### `PATCH /api/tickets/:id/reject`

- [x] Route (protected: owner)
- [x] Controller: reject ticket request by owner with reason + status history
- [ ] Test → 200

### `PATCH /api/tickets/:id/assign`

- [x] Route (protected: owner)
- [x] Controller: set assignedProvider + scheduledVisit, status=assigned, notify provider + student
- [ ] Test → 200

### `PATCH /api/tickets/:id/accept-task`

- [x] Route (protected: provider)
- [x] Controller: set status=in_progress, push to statusHistory
- [ ] Test → 200

### `PATCH /api/tickets/:id/decline-task`

- [x] Route (protected: provider)
- [x] Controller: clear assignedProvider, set status=approved, notify owner to reassign
- [ ] Test → 200

### `PATCH /api/tickets/:id/complete`

- [x] Route (protected: provider)
- [x] Controller: set completionDetails (notes, cost, proof photos), status=completed, notify student + owner
- [ ] Test → 200

### `PATCH /api/tickets/:id/confirm`

- [x] Route (protected: student)
- [x] Controller: if isResolved=true → status=closed, else → status=re_opened + notify owner
- [ ] Test → 200

### `POST /api/tickets/:id/rate`

- [x] Route (protected: student)
- [x] Controller: set providerRating + ownerRating, update provider.averageRating
- [ ] Test → 200

### `GET /api/service-providers`

- [x] Route (protected: owner)
- [x] Controller: find approved + available providers, filter by category/district/city/area
- [x] Include provider profile note + contact details in provider list response
- [x] Support expanded maintenance categories (plumbing, electrical, cleaning, painting, carpentry, masons, welding, cctv, other)
- [ ] Test → 200

### `GET /api/service-providers/categories`

- [x] Route (protected: owner)
- [x] Controller: return service-provider maintenance categories for category-page navigation

### `GET /api/service-providers/me`

- [x] Route (protected: provider)
- [x] Controller: return service provider profile for dashboard management

### `PUT /api/service-providers/me`

- [x] Route (protected: provider)
- [x] Controller: update provider profile (category, district, area, note, availability)

### `DELETE /api/service-providers/me`

- [x] Route (protected: provider)
- [x] Controller: remove provider profile (mark account deleted / unavailable)

### `POST /api/service-providers/bookings`

- [x] Route (protected: owner)
- [x] Controller: owner books provider by category + district + area + note

### `GET /api/service-providers/bookings/mine`

- [x] Route (protected: owner/provider)
- [x] Controller: list owner/provider service bookings

### `PATCH /api/service-providers/bookings/:id/status`

- [x] Route (protected: owner)
- [x] Controller: owner updates booking status to accepted/completed

## 6.3 Frontend — Student Ticket Pages

### Create Ticket

- [x] `components/ticket/CreateTicketForm.jsx`
  - [x] Category dropdown (plumbing, electrical, cleaning, etc.)
  - [x] Title + description fields
  - [x] Priority selector (Low/Medium/High/Urgent)
  - [x] Photo/video upload (max 5)
  - [x] Accommodation + room auto-populated from completed booking
  - [x] Submit button
- [x] API integration → POST /api/tickets

### My Tickets Page

- [x] `pages/student/MyTicketsPage.jsx`
- [x] Status filter tabs
- [x] Ticket cards: number, category icon, title, priority badge, status, date
- [x] Click → ticket detail

### Ticket Detail Page

- [x] `components/ticket/TicketDetail.jsx`
- [x] Status timeline (Open → Approved → Assigned → In Progress → Completed → Closed)
- [x] Issue details + attachments (photo viewer)
- [x] Assigned provider info + scheduled visit
- [x] Completion proof photos
- [x] Confirm resolution button (Yes resolved / Not resolved)
- [x] Rate provider + owner form (after closure)

## 6.4 Frontend — Owner Ticket Pages

### Owner Tickets Page

- [x] `pages/owner/OwnerTicketsPage.jsx`
- [x] Owner dashboard ticket request visibility (`pages/owner/OwnerDashboard.jsx`)
- [x] Owner dashboard quick action: search service providers (`pages/owner/ServiceProvidersPage.jsx`)
- [x] Filter by accommodation + status + priority
- [x] Ticket list with actions:
  - [x] Approve button (for open tickets)
  - [x] Reject button (for open/approved tickets)
  - [x] Assign provider button → provider selection modal
- [x] Provider selection modal:
  - [x] Filter by category + area
  - [x] Provider cards (name, rating, completed tasks, availability)
  - [x] Provider profile note + contact details
  - [x] Date picker + time slot selector
  - [x] Assign button

### Owner Service Provider Booking Page

- [x] `pages/owner/ServiceProvidersPage.jsx`
- [x] Show maintenance categories first, then load providers under selected category
- [x] Sidebar with all maintenance categories (as category menu)
- [x] Filter providers by selected category + district + city
- [x] View provider profile note and contact actions (phone/email)
- [x] Show provider photo in provider listing cards
- [x] Book provider under selected category
- [x] Owner booking status update actions (accepted/completed)

### Owner Service Category Page

- [x] `pages/owner/ServiceProviderCategoriesPage.jsx`
- [x] Category selection opens separate provider page route (`/owner/service-providers/:category`)
- [x] Provider page reads selected category from route and shows providers under that category

## 6.5 Frontend — Provider Pages

### Provider Dashboard

- [x] `pages/provider/ProviderDashboard.jsx`
- [x] Stats: assigned, in progress, completed counts
- [x] Upcoming scheduled visits
- [x] Recent task notifications
- [x] Remove embedded profile edit section from dashboard
- [x] Add quick action link to dedicated provider profile page
- [x] Show owner service bookings + owner contact details

### My Tasks Page

- [x] `pages/provider/MyTasksPage.jsx`
- [x] Status filter tabs (Incomplete, Finished)
- [x] Task cards with: category, title, location, scheduled date, priority
- [x] Accept/Decline buttons (for assigned tasks)
- [x] Mark complete form:
  - [x] Completion notes textarea
  - [x] Cost input (optional)
  - [x] Upload completion proof photos
  - [x] Submit button

### Provider Profile Page

- [x] `pages/provider/ProviderProfilePage.jsx`
- [x] Display all registration details: firstName, lastName, email, phone, nic, serviceCategories, areasOfOperation, yearsOfExperience, profileNote, profileImage, isAvailable
- [x] View mode: show all profile information in formatted display
- [x] Edit mode: inline form to update all editable fields
- [x] Save/Cancel buttons for profile updates
- [x] Profile image display with avatar fallback
- [x] Profile photo upload with preview in edit mode
- [x] Availability toggle
- [x] Profile removal option

### Navbar Update

- [x] `components/common/Navbar.jsx`
- [x] Restore original top-nav user display (no profile dropdown link)
- [x] Keep desktop and mobile navigation support
- [x] Access provider profile via dashboard `Manage Profile` button only

### Provider Profile Route

- [x] Add `/provider/profile` route to `App.jsx`
- [x] Route protected with `PrivateRoute` and `RoleRoute` (service_provider only)

### Backend Profile Endpoint Update

- [x] Update `GET /api/service-providers/me` to include `profileImage` field
- [x] Update `PUT /api/service-providers/me` to support `profileImage` updates

## 6.6 Frontend — State

- [x] `features/tickets/ticketSlice.js` + `ticketAPI.js`
- [x] `features/providers/providerSlice.js` + `providerAPI.js`

---

---

# Phase 7 — Module 7: Admin Panel

## 7.1 Backend — Admin APIs

### User Management

- [x] `GET /api/admin/users` — list all users with role/status filters + search
- [x] `PATCH /api/admin/users/:id/status` — approve/suspend/delete user
- [x] `PATCH /api/admin/owners/:id/verify` — verify/reject owner
- [x] `PATCH /api/admin/providers/:id/verify` — approve/reject provider

### Listing Moderation

- [x] `GET /api/admin/accommodations` — listings with status filters
- [x] `PATCH /api/admin/accommodations/:id/moderate` — approve/reject/freeze/unfreeze

### Report Management

- [x] `POST /api/reports/listing` — student submits listing report
- [x] `GET /api/admin/reports/listings` — all reports with status filter
- [x] `PATCH /api/admin/reports/:id/resolve` — resolve with action

### Review Moderation

- [x] `GET /api/admin/reviews/pending` — pending reviews
- [x] `PATCH /api/admin/reviews/:id/moderate` — approve/reject

### Analytics

- [x] `GET /api/admin/analytics/dashboard` — overview stats
- [x] `GET /api/admin/analytics/revenue` — revenue breakdown by period

### Transactions

- [x] `GET /api/admin/transactions` — all payments with filters

### Escalated Tickets

- [x] `GET /api/admin/tickets/escalated` — SLA-exceeded tickets

### Notification Console

- [x] `GET /api/admin/notifications/logs` — notification logs
- [x] `POST /api/admin/notifications/retry-failed` — retry failed notifications
- [x] `POST /api/admin/notifications/broadcast` — system announcement
- [x] `GET /api/admin/notification-templates` — list templates
- [x] `PUT /api/admin/notification-templates/:id` — update template

### Audit Logs

- [x] `GET /api/admin/audit-logs` — security logs with filters

## 7.2 Frontend — Admin Pages

### Admin Dashboard

- [x] `pages/admin/AdminDashboard.jsx`
- [x] Stats cards: total users, active listings, bookings this month, revenue, open tickets, pending reports
- [x] Quick charts: bookings over time, revenue over time, user growth
- [x] Recent activity feed
- [x] API → GET /api/admin/analytics/dashboard

### User Management Page

- [x] `pages/admin/UserManagementPage.jsx`
- [x] Role tabs (Students, Owners, Providers, All)
- [x] Search bar + status filter
- [x] User table: name, email, role, status, registered date, actions
- [x] Actions: View Profile modal, Approve, Suspend, Delete
- [x] Owner verification: view documents, approve/reject
- [x] Provider approval: view certifications, approve/reject

### Listing Moderation Page

- [x] `pages/admin/ListingModerationPage.jsx`
- [x] Status tabs (Pending Review, Active, Frozen, Reported)
- [x] Listing cards with owner info + report count
- [x] Actions: Approve, Reject (with reason), Freeze, Unfreeze, Unpublish
- [x] Click → full listing preview

### Reports Page

- [x] `pages/admin/ReportsPage.jsx`
- [x] Pending/resolved tabs
- [x] Report cards: reported listing, reporter, reason, evidence, date
- [x] Resolve modal: resolution note + action dropdown (none/warning/freeze/unpublish/suspend owner)

### Review Moderation

- [x] `components/admin/PendingReviewsList.jsx`
- [x] Review cards: student, accommodation, rating, content
- [x] Approve / Reject (with reason) buttons

### Transactions Page

- [x] `pages/admin/TransactionsPage.jsx`
- [x] Table: payment number, student, owner, amount, type, method, status, date
- [x] Filters: status, date range, payment type
- [x] Refund button → refund modal (amount, reason)

### Ticket Escalations Page

- [x] `pages/admin/TicketEscalationsPage.jsx`
- [x] Escalated tickets list with SLA overdue time
- [x] View details + contact owner action

### Notification Console Page

- [x] `pages/admin/NotificationConsolePage.jsx`
- [x] Notification logs table with delivery status
- [x] Filters: type, channel, status, date
- [x] Retry failed button
- [x] Broadcast announcement form (title, message, target group, channels)
- [x] Template management section (edit templates)

### Analytics/Reports Page

- [x] Revenue chart (monthly bar chart)
- [x] Bookings trend (line chart)
- [x] User distribution (pie chart)
- [x] Export to CSV/PDF button

### Audit Log Page

- [x] `pages/admin/AuditLogPage.jsx`
- [x] Table: timestamp, user, action, entity, IP, description
- [x] Filters: action type, user, entity type, date range
- [x] Search functionality

## 7.3 Frontend — State

- [x] `features/admin/adminSlice.js` + `adminAPI.js`

---

---

# Phase 8 — Notifications System (Cross-Cutting)

## 8.1 Backend

- [x] `models/Notification.js` — Full schema with TTL index, idempotency
- [x] `models/NotificationTemplate.js` — Template schema
- [x] `models/AuditLog.js` — Audit trail schema
- [x] `utils/notification.util.js`:
  - [x] `createNotification(recipientId, type, category, data)` — create in-app notification
  - [x] `sendEmailNotification(to, templateName, variables)` — render template + send via Nodemailer
  - [x] `checkIdempotency(key)` — prevent duplicate notifications
- [x] Integrate notification calls into all controllers:
  - [x] Registration → auto-login
  - [x] Booking request → owner email + in-app
  - [x] Booking accept/reject → student email + in-app
  - [ ] Payment success/fail → email + in-app
  - [ ] Invoice generated → email + in-app
  - [x] Ticket created → owner notification
  - [x] Ticket assigned → provider notification
  - [x] Ticket completed → student notification
  - [x] Report submitted → admin notification

### Notification User APIs

- [x] `GET /api/notifications` — user's notifications with unread count
- [x] `PATCH /api/notifications/:id/read` — mark as read
- [x] `PATCH /api/notifications/read-all` — mark all read

## 8.2 Frontend

- [x] `components/notification/NotificationBell.jsx` — navbar bell icon with unread badge count
- [x] `components/notification/NotificationDropdown.jsx` — dropdown list of recent notifications
- [x] `components/notification/NotificationItem.jsx` — icon + title + time + read/unread style
- [x] Click notification → navigate to related entity (booking, ticket, payment, etc.)
- [x] Mark as read on click
- [x] "Mark all as read" button
- [x] Polling or WebSocket for real-time updates (optional: Socket.io)
- [x] `hooks/useNotifications.js` — custom hook for notification polling
- [x] `features/notifications/notificationSlice.js` + `notificationAPI.js`

### Phase 8 Completion Notes

- [x] Implemented with polling-based real-time updates (30s interval + focus/visibility refresh).
- [x] Payment/invoice notification controller hooks are tracked separately and still pending under Phase 5 payment flow finalization.

---

---

# Phase 9 — Testing, Deployment & Documentation

## 9.1 Backend Testing

- [ ] Unit tests for all utility functions (token, email, pagination, auditLog)
- [ ] Integration tests for auth endpoints (register, login, verify, reset)
- [ ] Integration tests for accommodation CRUD
- [ ] Integration tests for booking flow (create → accept → pay → complete)
- [ ] Integration tests for ticket flow (create → assign → complete → close)
- [ ] Integration tests for admin endpoints
- [ ] Test payment gateway webhooks with sandbox
- [ ] Test email sending (use Mailtrap or Ethereal for testing)
- [ ] Load test with concurrent bookings

## 9.2 Frontend Testing

- [ ] Component tests for auth forms (Register, Login)
- [ ] Component tests for search filters
- [ ] Component tests for booking form
- [ ] Page-level tests for key flows
- [ ] E2E tests with Cypress:
  - [ ] Student: register → verify → search → book → pay → review
  - [ ] Owner: register → verify → create listing → manage bookings → manage tickets
  - [ ] Admin: login → moderate listing → resolve report → view analytics

## 9.3 Deployment

- [ ] Set up production MongoDB (Atlas)
- [ ] Set up file storage (AWS S3 / Cloudinary) for images/videos/documents
- [ ] Configure environment variables for production
- [ ] Deploy backend to (Render / Railway / AWS EC2 / DigitalOcean)
- [ ] Deploy frontend to (Vercel / Netlify / AWS Amplify)
- [ ] Set up domain + SSL certificate
- [ ] Configure CORS for production domain
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Set up monitoring (PM2 for Node, UptimeRobot for health checks)

## 9.4 Documentation

- [ ] API documentation (Swagger/Postman collection)
- [ ] Database schema document (completed ✅)
- [ ] Use case document (completed ✅)
- [ ] User manual (student, owner, provider, admin guides)
- [ ] System architecture diagram
- [ ] Deployment guide

---

---

# 📊 Task Summary

| Phase     | Module            | Backend Tasks | Frontend Tasks |  Total  |
| --------- | ----------------- | :-----------: | :------------: | :-----: |
| Phase 0   | Project Setup     |      25       |       20       |   45    |
| Phase 1   | Auth & Users      |      35       |       30       |   65    |
| Phase 2   | Accommodations    |      30       |       40       |   70    |
| Phase 3   | Bookings & Search |      25       |       35       |   60    |
| Phase 4   | Reviews & AI      |      15       |       12       |   27    |
| Phase 5   | Payments          |      18       |       15       |   33    |
| Phase 6   | Maintenance       |      25       |       30       |   55    |
| Phase 7   | Admin Panel       |      22       |       30       |   52    |
| Phase 8   | Notifications     |      15       |       10       |   25    |
| Phase 9   | Testing & Deploy  |      20       |       15       |   35    |
| **TOTAL** |                   |    **230**    |    **237**     | **467** |

---

> **💡 Pro Tips:**
>
> - Complete phases in order — each depends on the previous
> - Backend API first → test with Postman → then build frontend
> - Commit after each completed API/page (small, frequent commits)
> - Use Postman collection to document & test every endpoint
> - Keep `.env.example` updated as you add new variables
