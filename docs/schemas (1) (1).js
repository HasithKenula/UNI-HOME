// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================
// Collections: 16 total
// Users, Students, Owners, ServiceProviders, Admins,
// Accommodations, Rooms, Bookings, Payments, Invoices,
// Reviews, AIReviewSummaries, MaintenanceTickets,
// Notifications, ListingReports, Inquiries
// ============================================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 1. USER (Base Schema — Common fields for all user types)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - Referenced by: Notifications, Inquiries
//   - Discriminator base for: Student, Owner, ServiceProvider, Admin
// ────────────────────────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // hashed
    phone: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["student", "owner", "service_provider", "admin"],
    },
    profileImage: { type: String, default: null }, // URL
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended", "deleted"],
      default: "pending",
    },
    lastLogin: { type: Date, default: null },

    // Notification preferences (UC-2.3.1)
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      mutedThreads: [{ type: Schema.Types.ObjectId }], // accommodation/ticket IDs
    },

    address: {
      street: { type: String },
      city: { type: String },
      district: { type: String },
      postalCode: { type: String },
    },
  },
  {
    timestamps: true,
    discriminatorKey: "role",
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, accountStatus: 1 });

const User = mongoose.model("User", userSchema);

// ────────────────────────────────────────────────────────────────────────────
// 2. STUDENT (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: Bookings, Reviews, MaintenanceTickets, ListingReports
//   - Has many: Bookings, Reviews, MaintenanceTickets, Favorites
// ────────────────────────────────────────────────────────────────────────────

const studentSchema = new Schema({
  sliitEmail: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@my\.sliit\.lk$/, "Must be a valid SLIIT email"],
  },
  studentId: { type: String, required: true, unique: true }, // e.g., IT23822580
  batch: { type: String }, // e.g., Y2S2
  faculty: { type: String }, // e.g., Computing
  favorites: [{ type: Schema.Types.ObjectId, ref: "Accommodation" }],
});

const Student = User.discriminator("student", studentSchema);

// ────────────────────────────────────────────────────────────────────────────
// 3. OWNER (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: Accommodations (owner field)
//   - Has many: Accommodations
// ────────────────────────────────────────────────────────────────────────────

const ownerSchema = new Schema({
  nic: { type: String, required: true, unique: true },
  bankDetails: {
    bankName: { type: String },
    branchName: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
  },
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified",
  },
  verificationDocuments: [
    {
      documentType: {
        type: String,
        enum: ["nic_copy", "property_deed", "business_registration", "other"],
      },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  verificationNote: { type: String }, // admin note on approval/rejection
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin who verified
});

const Owner = User.discriminator("owner", ownerSchema);

// ────────────────────────────────────────────────────────────────────────────
// 4. SERVICE PROVIDER (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: MaintenanceTickets (assignedProvider)
//   - Has many: assigned MaintenanceTickets
// ────────────────────────────────────────────────────────────────────────────

const serviceProviderSchema = new Schema({
  nic: { type: String, required: true, unique: true },
  serviceCategories: [
    {
      type: String,
      enum: ["plumbing", "electrical", "cleaning", "painting", "carpentry", "general", "other"],
    },
  ],
  areasOfOperation: [
    {
      district: { type: String },
      cities: [{ type: String }],
    },
  ],
  certifications: [
    {
      name: { type: String },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verificationNote: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalTasksCompleted: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
});

const ServiceProvider = User.discriminator("service_provider", serviceProviderSchema);

// ────────────────────────────────────────────────────────────────────────────
// 5. ADMIN (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: various approval/moderation fields
// ────────────────────────────────────────────────────────────────────────────

const adminSchema = new Schema({
  adminLevel: {
    type: String,
    enum: ["super_admin", "admin", "moderator"],
    default: "admin",
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  permissions: [
    {
      type: String,
      enum: [
        "manage_users",
        "manage_accommodations",
        "manage_payments",
        "manage_reports",
        "manage_notifications",
        "manage_tickets",
        "view_analytics",
      ],
    },
  ],
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date, default: null },
});

const Admin = User.discriminator("admin", adminSchema);

// ────────────────────────────────────────────────────────────────────────────
// 6. ACCOMMODATION (Listing)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Owner (owner), Admin (reviewedBy)
//   - Referenced by: Rooms, Bookings, Reviews, AIReviewSummaries,
//                    MaintenanceTickets, ListingReports, Inquiries
//   - Embeds: location, pricing, bookingRules, facilities, houseRules, media
// ────────────────────────────────────────────────────────────────────────────

const accommodationSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    accommodationType: {
      type: String,
      required: true,
      enum: ["boarding_house", "room", "annex", "apartment"],
    },

    // Location
    location: {
      district: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] }, // [longitude, latitude]
      },
      distanceToSLIIT: { type: Number }, // in km
      nearbyLandmarks: [{ type: String }],
    },

    // Pricing
    pricing: {
      monthlyRent: { type: Number, required: true },
      keyMoney: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      billsIncluded: { type: Boolean, default: false },
      additionalBills: {
        water: { type: Number, default: 0 },
        electricity: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      currency: { type: String, default: "LKR" },
    },

    // Booking Rules
    bookingRules: {
      minimumPeriod: {
        type: String,
        enum: ["1_month", "3_months", "6_months", "1_year"],
        default: "6_months",
      },
      depositRequired: { type: Boolean, default: true },
      cancellationPolicy: {
        type: String,
        enum: ["flexible", "moderate", "strict"],
        default: "moderate",
      },
      cancellationNoticeDays: { type: Number, default: 30 },
    },

    // Facilities
    facilities: {
      wifi: { type: Boolean, default: false },
      furniture: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      attachedKitchen: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      hotWater: { type: Boolean, default: false },
      studyArea: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      mealsProvided: { type: Boolean, default: false },
    },

    // House Rules
    houseRules: {
      genderRestriction: {
        type: String,
        enum: ["boys_only", "girls_only", "mixed", "none"],
        default: "none",
      },
      visitorsAllowed: { type: Boolean, default: true },
      smokingAllowed: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
      quietHours: {
        from: { type: String }, // "22:00"
        to: { type: String }, // "06:00"
      },
      additionalRules: [{ type: String }],
    },

    // Media
    media: {
      photos: [
        {
          url: { type: String, required: true },
          caption: { type: String },
          isPrimary: { type: Boolean, default: false },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      videos: [
        {
          url: { type: String },
          caption: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Room configuration summary
    roomTypes: [
      {
        type: String,
        enum: ["single", "double", "shared", "studio"],
      },
    ],
    totalRooms: { type: Number, default: 1 },
    availableRooms: { type: Number, default: 1 },

    // Status & Moderation
    status: {
      type: String,
      enum: ["draft", "pending_review", "active", "unpublished", "frozen", "rejected"],
      default: "draft",
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "not_available", "limited_slots"],
      default: "available",
    },
    moderationNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    reviewedAt: { type: Date },
    publishedAt: { type: Date },

    // Rating summary (denormalized for performance)
    ratingsSummary: {
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      sentimentLabel: {
        type: String,
        enum: ["mostly_positive", "mixed", "mostly_negative", "no_reviews"],
        default: "no_reviews",
      },
    },

    // Analytics
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

accommodationSchema.index({ "location.coordinates": "2dsphere" });
accommodationSchema.index({ "location.district": 1, "location.city": 1 });
accommodationSchema.index({ status: 1, availabilityStatus: 1 });
accommodationSchema.index({ "pricing.monthlyRent": 1 });
accommodationSchema.index({ "houseRules.genderRestriction": 1 });
accommodationSchema.index({ owner: 1, status: 1 });
accommodationSchema.index({
  title: "text",
  description: "text",
  "location.city": "text",
  "location.district": "text",
});

const Accommodation = mongoose.model("Accommodation", accommodationSchema);

// ────────────────────────────────────────────────────────────────────────────
// 7. ROOM (Individual units within an accommodation)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Accommodation (accommodation)
//   - Referenced by: Bookings (room)
//   - Belongs to: Accommodation
// ────────────────────────────────────────────────────────────────────────────

const roomSchema = new Schema(
  {
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    roomNumber: { type: String, required: true },
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "shared", "studio"],
    },
    floor: { type: Number, default: 0 },
    maxOccupants: { type: Number, default: 1 },
    currentOccupants: { type: Number, default: 0 },

    // Room-specific pricing override (optional)
    monthlyRent: { type: Number }, // overrides accommodation pricing if set

    // Room-specific facilities
    hasAttachedBathroom: { type: Boolean, default: false },
    hasAirConditioning: { type: Boolean, default: false },
    isFurnished: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },

    // Current tenant tracking (denormalized)
    currentTenants: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User" },
        booking: { type: Schema.Types.ObjectId, ref: "Booking" },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ accommodation: 1, status: 1 });

const Room = mongoose.model("Room", roomSchema);

// ────────────────────────────────────────────────────────────────────────────
// 8. BOOKING
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (student), Accommodation (accommodation),
//                 Room (room), Owner (via accommodation)
//   - Referenced by: Payments, Invoices
//   - Belongs to: Student, Accommodation, Room
// ────────────────────────────────────────────────────────────────────────────

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true }, // auto-generated e.g., BK-2026-00001
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Booking details
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "shared", "studio"],
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date }, // calculated based on minimum period
    contractPeriod: {
      type: String,
      enum: ["1_month", "3_months", "6_months", "1_year"],
      required: true,
    },

    // Cost breakdown
    costSummary: {
      monthlyRent: { type: Number, required: true },
      keyMoney: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      totalInitialPayment: { type: Number, required: true }, // deposit + keyMoney + first month
      billsIncluded: { type: Boolean, default: false },
    },

    // Student info at booking time
    studentDetails: {
      specialRequests: { type: String },
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed", "expired"],
      default: "pending",
    },
    rejectionReason: { type: String },
    cancellationReason: { type: String },
    cancelledBy: {
      type: String,
      enum: ["student", "owner", "admin", null],
      default: null,
    },
    cancelledAt: { type: Date },
    confirmedAt: { type: Date },
    completedAt: { type: Date },

    // Payment tracking (denormalized)
    paymentStatus: {
      depositPaid: { type: Boolean, default: false },
      keyMoneyPaid: { type: Boolean, default: false },
      currentMonthPaid: { type: Boolean, default: false },
      lastPaymentDate: { type: Date },
      outstandingAmount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ student: 1, status: 1 });
bookingSchema.index({ accommodation: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

// ────────────────────────────────────────────────────────────────────────────
// 9. PAYMENT
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Booking (booking), Student (paidBy), Owner (paidTo)
//   - Referenced by: Invoices
//   - Belongs to: Booking
// ────────────────────────────────────────────────────────────────────────────

const paymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true }, // auto-generated
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // student
    paidTo: { type: Schema.Types.ObjectId, ref: "User", required: true }, // owner

    // Payment details
    paymentType: {
      type: String,
      required: true,
      enum: ["booking_fee", "key_money", "deposit", "monthly_rent", "water_bill", "electricity_bill", "other"],
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },

    // Gateway info
    paymentMethod: {
      type: String,
      enum: ["stripe", "payhere", "paypal", "bank_transfer", "cash"],
      required: true,
    },
    gatewayTransactionId: { type: String }, // from payment gateway
    gatewayResponse: { type: Schema.Types.Mixed }, // raw response from gateway

    // Status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "partially_refunded", "disputed"],
      default: "pending",
    },
    paidAt: { type: Date },
    failureReason: { type: String },

    // Refund tracking
    refund: {
      isRefunded: { type: Boolean, default: false },
      refundAmount: { type: Number, default: 0 },
      refundReason: { type: String },
      refundedAt: { type: Date },
      refundTransactionId: { type: String },
      initiatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    },

    // Receipt
    receiptUrl: { type: String },
    receiptSentAt: { type: Date },

    // For recurring
    billingPeriod: {
      month: { type: Number }, // 1-12
      year: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1, paymentType: 1 });
paymentSchema.index({ paidBy: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentNumber: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

// ────────────────────────────────────────────────────────────────────────────
// 10. INVOICE
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Booking (booking), Student (student), Payment (payment)
//   - Belongs to: Booking
// ────────────────────────────────────────────────────────────────────────────

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // INV-2026-00001
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Invoice details
    invoiceType: {
      type: String,
      enum: ["initial_payment", "monthly_rent", "additional_bill", "one_time"],
      required: true,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String }, // deposit, key_money, rent, water, electricity
      },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },

    // Dates
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    billingPeriod: {
      from: { type: Date },
      to: { type: Date },
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled", "void"],
      default: "draft",
    },

    // Linked payment
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    paidAt: { type: Date },

    // Recurrence
    isRecurring: { type: Boolean, default: false },
    recurringSchedule: {
      type: String,
      enum: ["monthly", "quarterly", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ booking: 1, status: 1 });
invoiceSchema.index({ student: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

// ────────────────────────────────────────────────────────────────────────────
// 11. REVIEW
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (student), Accommodation (accommodation),
//                 Booking (booking)
//   - Referenced by: AIReviewSummary (source reviews)
//   - Belongs to: Accommodation, Student
// ────────────────────────────────────────────────────────────────────────────

const reviewSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },

    // Rating
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    categoryRatings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      facilities: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      ownerResponse: { type: Number, min: 1, max: 5 },
    },

    // Review text
    title: { type: String, trim: true },
    content: { type: String, required: true, minlength: 10 },

    // Moderation
    status: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    rejectionReason: { type: String },

    // Helpfulness
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ accommodation: 1, status: 1 });
reviewSchema.index({ student: 1 });
// Ensure one review per student per booking
reviewSchema.index({ student: 1, booking: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

// ────────────────────────────────────────────────────────────────────────────
// 12. AI REVIEW SUMMARY
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Accommodation (accommodation), Admin (regeneratedBy)
//   - Belongs to: Accommodation (one-to-one)
// ────────────────────────────────────────────────────────────────────────────

const aiReviewSummarySchema = new Schema(
  {
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      unique: true,
    },

    // AI-generated content
    summary: { type: String, required: true }, // 2-3 line summary
    sentiment: {
      type: String,
      enum: ["mostly_positive", "mixed", "mostly_negative"],
      required: true,
    },
    sentimentScore: { type: Number, min: -1, max: 1 }, // -1 to 1

    // Analysis breakdown
    positiveKeywords: [{ type: String }],
    negativeKeywords: [{ type: String }],
    commonThemes: [
      {
        theme: { type: String },
        sentiment: { type: String, enum: ["positive", "negative", "neutral"] },
        frequency: { type: Number },
      },
    ],

    // Metadata
    reviewsAnalyzed: { type: Number, required: true },
    averageRating: { type: Number, required: true },
    lastReviewDate: { type: Date },
    generatedAt: { type: Date, default: Date.now },
    modelVersion: { type: String }, // AI model version used

    // Admin moderation
    isModerated: { type: Boolean, default: false },
    moderatedSummary: { type: String }, // admin-edited version
    regeneratedBy: { type: Schema.Types.ObjectId, ref: "User" },
    regeneratedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const AIReviewSummary = mongoose.model("AIReviewSummary", aiReviewSummarySchema);

// ────────────────────────────────────────────────────────────────────────────
// 13. MAINTENANCE TICKET
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (createdBy), Accommodation (accommodation),
//                 Room (room), Owner (owner), ServiceProvider (assignedProvider)
//   - Belongs to: Student, Accommodation
// ────────────────────────────────────────────────────────────────────────────

const maintenanceTicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true }, // TK-2026-00001
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // student
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Issue details
    category: {
      type: String,
      required: true,
      enum: ["plumbing", "electrical", "cleaning", "painting", "carpentry", "general", "other"],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Evidence
    attachments: [
      {
        type: { type: String, enum: ["photo", "video"] },
        url: { type: String, required: true },
        caption: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Status tracking
    status: {
      type: String,
      enum: ["open", "approved", "assigned", "in_progress", "completed", "re_opened", "closed", "escalated"],
      default: "open",
    },

    // Assignment
    assignedProvider: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date },
    scheduledVisit: {
      date: { type: Date },
      timeSlot: { type: String }, // "09:00 - 12:00"
    },

    // Completion
    completionDetails: {
      completedAt: { type: Date },
      completionProof: [
        {
          url: { type: String },
          caption: { type: String },
        },
      ],
      completionNotes: { type: String },
      cost: { type: Number, default: 0 },
      costApprovedByOwner: { type: Boolean, default: false },
    },

    // Confirmation & feedback
    confirmedByStudent: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    closedAt: { type: Date },

    // Rating
    providerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      ratedAt: { type: Date },
    },
    ownerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      ratedAt: { type: Date },
    },

    // SLA tracking
    sla: {
      responseDeadline: { type: Date }, // owner must respond by
      resolutionDeadline: { type: Date }, // must be resolved by
      isEscalated: { type: Boolean, default: false },
      escalatedAt: { type: Date },
      escalatedTo: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    },

    // Status history log
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

maintenanceTicketSchema.index({ status: 1, priority: 1 });
maintenanceTicketSchema.index({ assignedProvider: 1, status: 1 });
maintenanceTicketSchema.index({ ticketNumber: 1 });

const MaintenanceTicket = mongoose.model("MaintenanceTicket", maintenanceTicketSchema);

// ────────────────────────────────────────────────────────────────────────────
// 14. NOTIFICATION
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (recipient), various entities via relatedEntity
// ────────────────────────────────────────────────────────────────────────────

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Notification content
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        // User & Verification
        "registration_confirmation",
        "verification_request",
        "verification_approved",
        "verification_rejected",
        // Accommodation & Moderation
        "listing_submitted",
        "listing_approved",
        "listing_rejected",
        "listing_unpublished",
        "listing_frozen",
        "listing_reported",
        // Booking
        "booking_request",
        "booking_accepted",
        "booking_rejected",
        "booking_cancelled",
        "booking_confirmed",
        // Payment
        "invoice_generated",
        "payment_successful",
        "payment_failed",
        "payment_pending",
        "payment_disputed",
        "deposit_confirmed",
        "refund_initiated",
        "refund_completed",
        // Maintenance
        "ticket_created",
        "ticket_assigned",
        "ticket_in_progress",
        "ticket_completed",
        "ticket_re_opened",
        "ticket_closed",
        "ticket_escalated",
        // System
        "system_announcement",
        "general",
      ],
    },
    category: {
      type: String,
      enum: ["user", "accommodation", "booking", "payment", "maintenance", "system"],
      required: true,
    },

    // Channel
    channel: {
      type: String,
      enum: ["in_app", "email", "sms", "whatsapp"],
      required: true,
    },

    // Related entity (polymorphic reference)
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["accommodation", "booking", "payment", "ticket", "user", "review", "invoice"],
      },
      entityId: { type: Schema.Types.ObjectId },
    },

    // Status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    deliveryAttempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    failureReason: { type: String },

    // Idempotency (prevent duplicates — UC-2.3.5)
    idempotencyKey: { type: String, unique: true, sparse: true },

    // Expiry
    expiresAt: { type: Date }, // auto-delete after 90 days
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, channel: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
notificationSchema.index({ idempotencyKey: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

// ────────────────────────────────────────────────────────────────────────────
// 15. LISTING REPORT
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (reportedBy), Accommodation (accommodation),
//                 Admin (resolvedBy)
//   - Belongs to: Student, Accommodation
// ────────────────────────────────────────────────────────────────────────────

const listingReportSchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },

    // Report details
    reason: {
      type: String,
      required: true,
      enum: [
        "fake_listing",
        "unsafe_conditions",
        "misleading_info",
        "inappropriate_content",
        "discrimination",
        "scam",
        "other",
      ],
    },
    description: { type: String },
    evidence: [
      {
        url: { type: String },
        type: { type: String, enum: ["screenshot", "photo"] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Resolution
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
    actionTaken: {
      type: String,
      enum: ["none", "warning_issued", "listing_unpublished", "listing_frozen", "owner_suspended"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from same student for same listing
listingReportSchema.index({ reportedBy: 1, accommodation: 1 }, { unique: true });

const ListingReport = mongoose.model("ListingReport", listingReportSchema);

// ────────────────────────────────────────────────────────────────────────────
// 16. INQUIRY (Student ↔ Owner Communication)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (student), Owner (owner),
//                 Accommodation (accommodation)
//   - Belongs to: Student, Owner, Accommodation
// ────────────────────────────────────────────────────────────────────────────

const inquirySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
    },

    // Communication method
    communicationMethod: {
      type: String,
      enum: ["in_app", "whatsapp", "inquiry_form"],
      required: true,
    },

    // Messages (for in-app messaging)
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
      },
    ],

    // Initial inquiry form data
    inquiryForm: {
      subject: { type: String },
      message: { type: String },
      preferredContactMethod: {
        type: String,
        enum: ["email", "phone", "whatsapp"],
      },
    },

    // Status
    status: {
      type: String,
      enum: ["open", "responded", "closed"],
      default: "open",
    },

    // Contact sharing control (UC-1.5.1)
    contactShared: { type: Boolean, default: false },
    contactSharedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

inquirySchema.index({ student: 1, accommodation: 1 });
inquirySchema.index({ owner: 1, status: 1 });

const Inquiry = mongoose.model("Inquiry", inquirySchema);

// ────────────────────────────────────────────────────────────────────────────
// 17. NOTIFICATION TEMPLATE (Admin managed — UC-2.3.4)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - Referenced by: Notification system (for generating notifications)
//   - Managed by: Admin
// ────────────────────────────────────────────────────────────────────────────

const notificationTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // matches notification type enum
    channel: {
      type: String,
      enum: ["in_app", "email", "sms", "whatsapp"],
      required: true,
    },

    // Template content
    subject: { type: String }, // for email
    titleTemplate: { type: String, required: true }, // supports {{variables}}
    bodyTemplate: { type: String, required: true }, // supports {{variables}}
    htmlTemplate: { type: String }, // for email HTML

    // Variables
    availableVariables: [{ type: String }], // e.g., ["studentName", "accommodationTitle", "amount"]

    isActive: { type: Boolean, default: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const NotificationTemplate = mongoose.model("NotificationTemplate", notificationTemplateSchema);

// ────────────────────────────────────────────────────────────────────────────
// 18. AUDIT LOG (Security & Audit — UC-2.3.5)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (performedBy), various entities
// ────────────────────────────────────────────────────────────────────────────

const auditLogSchema = new Schema(
  {
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    action: {
      type: String,
      required: true,
      enum: [
        "user_register",
        "user_login",
        "user_logout",
        "user_update",
        "user_suspend",
        "user_delete",
        "listing_create",
        "listing_update",
        "listing_publish",
        "listing_unpublish",
        "listing_freeze",
        "listing_approve",
        "listing_reject",
        "booking_create",
        "booking_accept",
        "booking_reject",
        "booking_cancel",
        "payment_initiate",
        "payment_complete",
        "payment_fail",
        "refund_initiate",
        "refund_complete",
        "ticket_create",
        "ticket_assign",
        "ticket_complete",
        "ticket_close",
        "ticket_escalate",
        "review_submit",
        "review_approve",
        "review_reject",
        "notification_send",
        "notification_fail",
        "report_submit",
        "report_resolve",
        "admin_action",
      ],
    },
    entityType: {
      type: String,
      enum: ["user", "accommodation", "booking", "payment", "ticket", "review", "notification", "report", "invoice"],
    },
    entityId: { type: Schema.Types.ObjectId },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed }, // additional context
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// ────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  User,
  Student,
  Owner,
  ServiceProvider,
  Admin,
  Accommodation,
  Room,
  Booking,
  Payment,
  Invoice,
  Review,
  AIReviewSummary,
  MaintenanceTicket,
  Notification,
  ListingReport,
  Inquiry,
  NotificationTemplate,
  AuditLog,
};
