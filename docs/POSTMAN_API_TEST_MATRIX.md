# UNI-HOME Postman API Test Matrix

## Base Setup
- Base URL: http://localhost:5000/api
- Auth header: Authorization: Bearer {{accessToken}}
- Content type: application/json (or multipart/form-data for upload endpoints)

## Recommended Postman Environment Variables
- baseUrl = http://localhost:5000/api
- accessToken = (set after login)
- refreshToken = (set after login)
- userId = 
- accommodationId = 
- roomId = 
- bookingId = 
- inquiryId = 
- reviewId = 
- ticketId = 
- providerId = 
- serviceBookingId = 
- notificationId = 

## Endpoint Inventory (from server routes)

### Health
- GET /health

### Auth (/auth)
- POST /register
- POST /login
- POST /refresh
- POST /forgot-password
- POST /reset-password
- POST /logout

### Users (/users)
- GET /me
- GET /profile
- PUT /me
- PUT /profile
- DELETE /me
- PUT /change-password
- PUT /notification-preferences
- GET /tenant-notices
- GET /admin/users
- PATCH /admin/users/:id/status

### Accommodations (/accommodations)
- GET /
- GET /owner/my-listings
- GET /:id
- POST /:id/view
- POST /
- PUT /:id
- PATCH /:id/publish
- PATCH /:id/unpublish
- DELETE /:id
- POST /:accommodationId/rooms
- GET /:accommodationId/rooms
- PUT /rooms/:roomId
- DELETE /rooms/:roomId
- GET /:id/tenants
- POST /:id/notices

### Bookings (/bookings)
- POST /
- GET /
- PATCH /:bookingId/assign-room
- GET /:id
- PATCH /:id/pay
- PATCH /:id
- PATCH /:id/accept
- PATCH /:id/reject
- PATCH /:id/cancel
- PATCH /:id/complete

### Favorites (/favorites)
- GET /
- POST /:accommodationId
- DELETE /:accommodationId

### Inquiries (/inquiries)
- POST /
- GET /
- POST /:inquiryId/messages
- PATCH /:inquiryId/close

### Tickets (/tickets)
- POST /
- GET /
- GET /:id
- PATCH /:id/approve
- PATCH /:id/reject
- PATCH /:id/assign
- PATCH /:id/accept-task
- PATCH /:id/decline-task
- PATCH /:id/complete
- PATCH /:id/confirm
- POST /:id/rate

### Service Providers (/service-providers)
- GET /categories
- GET /
- GET /:providerId/booked-dates
- GET /:providerId/details
- POST /:providerId/reviews
- PATCH /:providerId/reviews/:reviewId
- DELETE /:providerId/reviews/:reviewId
- PATCH /:providerId/reviews/:reviewId/helpful
- GET /me
- PUT /me
- DELETE /me
- POST /bookings
- GET /bookings/mine
- PATCH /bookings/:id
- PATCH /bookings/:id/cancel
- PATCH /bookings/:id/status

### Admin (/admin)
- GET /users
- PATCH /users/:id/status
- PATCH /owners/:id/verify
- PATCH /providers/:id/verify
- GET /accommodations
- PATCH /accommodations/:id/moderate
- GET /reports/listings
- PATCH /reports/:id/resolve
- GET /reviews/pending
- PATCH /reviews/:id/moderate
- GET /analytics/dashboard
- GET /analytics/revenue
- GET /transactions
- GET /tickets/escalated
- GET /notifications/logs
- POST /notifications/retry-failed
- POST /notifications/broadcast
- GET /notification-templates
- PUT /notification-templates/:id
- GET /audit-logs

### Reports (/reports)
- POST /listing

### Reviews (/reviews)
- POST /
- GET /accommodation/:accommodationId
- GET /eligibility/:accommodationId
- GET /owner
- PATCH /:id/moderate
- PUT /:id
- DELETE /:id
- POST /:id/helpful

### AI Summaries (/ai-summaries)
- POST /regenerate-all
- GET /:accommodationId
- POST /:accommodationId/regenerate

### Notifications (/notifications)
- GET /
- PATCH /read-all
- PATCH /:id/read

---

## Postman Test Flow (Practical Order)
1. Health check
2. Register users by role: student, owner, admin, service_provider
3. Login each role and store tokens in role-specific environments
4. Owner creates accommodation
5. Owner creates room under accommodation
6. Student creates booking
7. Owner accepts booking and optionally assigns room
8. Student payment for booking
9. Student creates review and inquiry
10. Student creates maintenance ticket
11. Owner assigns ticket to provider
12. Provider accepts and completes task
13. Student confirms and rates task
14. Admin moderation and analytics endpoints

---

## Ready-to-Use Request Examples

### 1) Health
Request:
- GET {{baseUrl}}/health

Tests:
```javascript
pm.test('Health is 200', () => pm.response.to.have.status(200));
pm.test('Health success true', () => {
  const j = pm.response.json();
  pm.expect(j.success).to.eql(true);
});
```

### 2) Register Student
Request:
- POST {{baseUrl}}/auth/register
- Body (form-data if sending profileImage, otherwise JSON)
```json
{
  "firstName": "Test",
  "lastName": "Student",
  "email": "student01@my.sliit.lk",
  "password": "Pass@12345",
  "phone": "0771234567",
  "role": "student",
  "studentId": "IT22999999",
  "batch": "Y3S2",
  "faculty": "Computing"
}
```

Tests:
```javascript
pm.test('Register created', () => pm.response.to.have.status(201));
const j = pm.response.json();
pm.expect(j.success).to.eql(true);
if (j.accessToken) pm.environment.set('accessToken', j.accessToken);
if (j.refreshToken) pm.environment.set('refreshToken', j.refreshToken);
if (j.user && j.user._id) pm.environment.set('userId', j.user._id);
```

### 3) Login
Request:
- POST {{baseUrl}}/auth/login
```json
{
  "email": "student01@my.sliit.lk",
  "password": "Pass@12345"
}
```

Tests:
```javascript
pm.test('Login OK', () => pm.response.to.have.status(200));
const j = pm.response.json();
pm.environment.set('accessToken', j.accessToken);
pm.environment.set('refreshToken', j.refreshToken);
pm.test('Token exists', () => pm.expect(j.accessToken).to.be.a('string'));
```

### 4) Create Accommodation (Owner)
Request:
- POST {{baseUrl}}/accommodations
- Headers: Authorization Bearer owner token
- Body (form-data for photos/videos or JSON for basic data)
```json
{
  "title": "Malabe Boys Annex",
  "description": "Quiet place near SLIIT",
  "accommodationType": "annex",
  "location": {
    "district": "Colombo",
    "city": "Malabe",
    "address": "Kaduwela Rd",
    "coordinates": { "coordinates": [79.9729, 6.9061] }
  },
  "pricing": { "monthlyRent": 25000 }
}
```

Tests:
```javascript
pm.test('Accommodation created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const id = j?.data?._id || j?._id;
if (id) pm.environment.set('accommodationId', id);
```

### 5) Create Room
Request:
- POST {{baseUrl}}/accommodations/{{accommodationId}}/rooms
```json
{
  "roomNumber": "A-01",
  "roomType": "single",
  "maxOccupants": 1,
  "monthlyRent": 28000
}
```

Tests:
```javascript
pm.test('Room created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const roomId = j?.data?._id || j?._id;
if (roomId) pm.environment.set('roomId', roomId);
```

### 6) Create Booking (Student)
Request:
- POST {{baseUrl}}/bookings
```json
{
  "accommodationId": "{{accommodationId}}",
  "bookingScope": "room",
  "roomId": "{{roomId}}",
  "checkInDate": "2026-05-01",
  "contractPeriod": "6_months",
  "specialRequests": "Need study table",
  "emergencyContact": {
    "name": "Parent Name",
    "phone": "0777654321"
  }
}
```

Tests:
```javascript
pm.test('Booking created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const bookingId = j?.data?._id || j?._id;
if (bookingId) pm.environment.set('bookingId', bookingId);
```

### 7) Accept Booking (Owner)
Request:
- PATCH {{baseUrl}}/bookings/{{bookingId}}/accept

Tests:
```javascript
pm.test('Booking accepted', () => pm.response.to.have.status(200));
```

### 8) Pay Booking (Student)
Request:
- PATCH {{baseUrl}}/bookings/{{bookingId}}/pay
```json
{
  "paymentMethod": "card",
  "paymentType": "booking_fee",
  "amount": 5000,
  "cardDetails": { "last4": "4242" },
  "billingContact": {
    "email": "student01@my.sliit.lk",
    "phone": "0771234567"
  }
}
```

Tests:
```javascript
pm.test('Payment accepted', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
```

### 9) Create Inquiry
Request:
- POST {{baseUrl}}/inquiries
```json
{
  "accommodationId": "{{accommodationId}}",
  "communicationMethod": "in_app",
  "message": "Is water bill included?",
  "subject": "Bills",
  "preferredContactMethod": "email"
}
```

Tests:
```javascript
pm.test('Inquiry created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const inquiryId = j?.data?._id || j?._id;
if (inquiryId) pm.environment.set('inquiryId', inquiryId);
```

### 10) Create Review
Request:
- POST {{baseUrl}}/reviews
```json
{
  "accommodationId": "{{accommodationId}}",
  "bookingId": "{{bookingId}}",
  "overallRating": 4.5,
  "title": "Good stay",
  "content": "Clean room and owner was responsive.",
  "categoryRatings": {
    "cleanliness": 5,
    "facilities": 4,
    "location": 4,
    "valueForMoney": 4,
    "ownerResponse": 5
  }
}
```

Tests:
```javascript
pm.test('Review created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const reviewId = j?.data?._id || j?._id;
if (reviewId) pm.environment.set('reviewId', reviewId);
```

### 11) Create Ticket (Student)
Request:
- POST {{baseUrl}}/tickets
- Use form-data if uploading attachments
```json
{
  "bookingId": "{{bookingId}}",
  "accommodationId": "{{accommodationId}}",
  "category": "plumbing",
  "title": "Bathroom tap leaking",
  "description": "Tap leaking continuously near sink",
  "priority": "high"
}
```

Tests:
```javascript
pm.test('Ticket created', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
const j = pm.response.json();
const ticketId = j?.data?._id || j?._id;
if (ticketId) pm.environment.set('ticketId', ticketId);
```

### 12) Assign Ticket (Owner/Admin)
Request:
- PATCH {{baseUrl}}/tickets/{{ticketId}}/assign
```json
{
  "providerId": "{{providerId}}",
  "scheduledDate": "2026-05-03",
  "timeSlot": "09:00-11:00"
}
```

Tests:
```javascript
pm.test('Ticket assigned', () => pm.response.to.have.status(200));
```

### 13) Provider Updates Ticket Status
Request:
- PATCH {{baseUrl}}/tickets/{{ticketId}}/accept-task
- PATCH {{baseUrl}}/tickets/{{ticketId}}/complete (with completionProof files optional)
```json
{
  "completionNotes": "Leak fixed and tested",
  "cost": 2500
}
```

Tests:
```javascript
pm.test('Ticket progressed', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));
```

### 14) Student Confirms and Rates Ticket
Request 1:
- PATCH {{baseUrl}}/tickets/{{ticketId}}/confirm
```json
{
  "isResolved": true,
  "note": "Issue solved"
}
```

Request 2:
- POST {{baseUrl}}/tickets/{{ticketId}}/rate
```json
{
  "providerRating": 5,
  "providerFeedback": "Arrived on time"
}
```

### 15) Notifications
Request:
- GET {{baseUrl}}/notifications?page=1&limit=10
- PATCH {{baseUrl}}/notifications/read-all
- PATCH {{baseUrl}}/notifications/{{notificationId}}/read

Tests:
```javascript
pm.test('Notifications endpoint works', () => pm.response.to.have.status(200));
```

### 16) Service Provider Booking by Owner
Request:
- POST {{baseUrl}}/service-providers/bookings
```json
{
  "providerId": "{{providerId}}",
  "category": "plumbing",
  "accommodationLocation": "Malabe",
  "note": "Need sink repair",
  "preferredDate": "2026-05-05"
}
```

### 17) Admin Examples
Request:
- GET {{baseUrl}}/admin/users
- PATCH {{baseUrl}}/admin/users/{{userId}}/status
```json
{
  "accountStatus": "active"
}
```

---

## Common Negative Tests You Should Add in Postman
- Missing token -> expect 401 on protected endpoints.
- Wrong role token -> expect 403 on role-protected endpoints.
- Invalid Mongo ID -> expect 400 validation error.
- Required body missing -> expect 400 with validation messages.
- Access another user resource -> expect 403/404 depending on endpoint logic.

---

## Notes
- Some endpoints use multipart/form-data when files are uploaded:
  - POST /auth/register (optional profileImage)
  - POST /accommodations, PUT /accommodations/:id (photos/videos)
  - POST /accommodations/:accommodationId/rooms, PUT /accommodations/rooms/:roomId (roomPhotos/roomVideos)
  - POST /tickets (attachments)
  - PATCH /tickets/:id/complete (completionProof)
- Rate limits exist for API and auth routes; high-volume runs may trigger 429.
- Use separate Postman environments for each role token (student/owner/admin/service_provider).
