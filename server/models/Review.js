// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

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

module.exports = Review;
