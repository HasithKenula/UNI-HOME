// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;
import User from "./User.js";

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

export default Admin;
