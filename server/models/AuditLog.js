// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

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

export default AuditLog;
