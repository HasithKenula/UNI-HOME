// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 13. MAINTENANCE TICKET
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (createdBy), Accommodation (accommodation),
//                 Room (room), Owner (owner), ServiceProvider (assignedProvider)
//   - Belongs to: Student, Accommodation
// ────────────────────────────────────────────────────────────────────────────

const maintenanceTicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true }, // TK-2026-00001
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // student
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Issue details
    category: {
      type: String,
      required: true,
      enum: ["plumbing", "electrical", "cleaning", "painting", "carpentry", "general", "other"],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Evidence
    attachments: [
      {
        type: { type: String, enum: ["photo", "video"] },
        url: { type: String, required: true },
        caption: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Status tracking
    status: {
      type: String,
      enum: ["open", "approved", "assigned", "in_progress", "completed", "re_opened", "closed", "escalated"],
      default: "open",
    },

    // Assignment
    assignedProvider: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date },
    scheduledVisit: {
      date: { type: Date },
      timeSlot: { type: String }, // "09:00 - 12:00"
    },

    // Completion
    completionDetails: {
      completedAt: { type: Date },
      completionProof: [
        {
          url: { type: String },
          caption: { type: String },
        },
      ],
      completionNotes: { type: String },
      cost: { type: Number, default: 0 },
      costApprovedByOwner: { type: Boolean, default: false },
    },

    // Confirmation & feedback
    confirmedByStudent: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    closedAt: { type: Date },

    // Rating
    providerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      ratedAt: { type: Date },
    },
    ownerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      ratedAt: { type: Date },
    },

    // SLA tracking
    sla: {
      responseDeadline: { type: Date }, // owner must respond by
      resolutionDeadline: { type: Date }, // must be resolved by
      isEscalated: { type: Boolean, default: false },
      escalatedAt: { type: Date },
      escalatedTo: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    },

    // Status history log
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

maintenanceTicketSchema.index({ status: 1, priority: 1 });
maintenanceTicketSchema.index({ assignedProvider: 1, status: 1 });
maintenanceTicketSchema.index({ ticketNumber: 1 });

const MaintenanceTicket = mongoose.model("MaintenanceTicket", maintenanceTicketSchema);

export default MaintenanceTicket;
