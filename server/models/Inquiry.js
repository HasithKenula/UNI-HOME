// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 17. INQUIRY (Student ↔ Owner Communication)
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

export default Inquiry;
