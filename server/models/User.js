// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
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

module.exports = User;
