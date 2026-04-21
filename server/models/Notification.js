// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

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
        "ticket_update",
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

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
