// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 15. NOTIFICATION TEMPLATE (Admin managed — UC-2.3.4)
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

module.exports = NotificationTemplate;
