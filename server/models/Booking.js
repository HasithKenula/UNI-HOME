// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 8. BOOKING
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Student (student), Accommodation (accommodation),
//                 Room (room), Owner (via accommodation)
//   - Referenced by: Payments, Invoices
//   - Belongs to: Student, Accommodation, Room
// ────────────────────────────────────────────────────────────────────────────

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true }, // auto-generated e.g., BK-2026-00001
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Booking details
    bookingScope: {
      type: String,
      enum: ["accommodation", "room"],
      default: "accommodation",
    },
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "shared", "studio"],
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date }, // calculated based on minimum period
    contractPeriod: {
      type: String,
      enum: ["1_month", "3_months", "6_months", "1_year"],
      required: true,
    },

    // Cost breakdown
    costSummary: {
      monthlyRent: { type: Number, required: true },
      keyMoney: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      totalInitialPayment: { type: Number, required: true }, // deposit + keyMoney + first month
      billsIncluded: { type: Boolean, default: false },
    },

    // Student info at booking time
    studentDetails: {
      specialRequests: { type: String },
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed", "expired"],
      default: "pending",
    },
    rejectionReason: { type: String },
    cancellationReason: { type: String },
    cancelledBy: {
      type: String,
      enum: ["student", "owner", "admin", null],
      default: null,
    },
    cancelledAt: { type: Date },
    confirmedAt: { type: Date },
    completedAt: { type: Date },

    // Payment tracking (denormalized)
    paymentStatus: {
      depositPaid: { type: Boolean, default: false },
      keyMoneyPaid: { type: Boolean, default: false },
      currentMonthPaid: { type: Boolean, default: false },
      lastPaymentDate: { type: Date },
      outstandingAmount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ student: 1, status: 1 });
bookingSchema.index({ accommodation: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
