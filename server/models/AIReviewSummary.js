// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

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

export default AIReviewSummary;
