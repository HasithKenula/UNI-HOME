// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

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

    // Soft delete support
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },

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
accommodationSchema.index({ isDeleted: 1, status: 1 });
accommodationSchema.index({
  title: "text",
  description: "text",
  "location.city": "text",
  "location.district": "text",
});

const Accommodation = mongoose.model("Accommodation", accommodationSchema);

export default Accommodation;
