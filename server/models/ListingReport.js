// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 16. LISTING REPORT
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

export default ListingReport;
