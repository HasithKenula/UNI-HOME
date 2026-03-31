// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 9. PAYMENT
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Booking (booking), Student (paidBy), Owner (paidTo)
//   - Referenced by: Invoices
//   - Belongs to: Booking
// ────────────────────────────────────────────────────────────────────────────

const paymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true }, // auto-generated
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // student
    paidTo: { type: Schema.Types.ObjectId, ref: "User", required: true }, // owner

    // Payment details
    paymentType: {
      type: String,
      required: true,
      enum: ["booking_fee", "key_money", "deposit", "monthly_rent", "water_bill", "electricity_bill", "other"],
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },

    // Gateway info
    paymentMethod: {
      type: String,
      enum: ["stripe", "payhere", "paypal", "bank_transfer", "cash"],
      required: true,
    },
    gatewayTransactionId: { type: String }, // from payment gateway
    gatewayResponse: { type: Schema.Types.Mixed }, // raw response from gateway

    // Status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "partially_refunded", "disputed"],
      default: "pending",
    },
    paidAt: { type: Date },
    failureReason: { type: String },

    // Refund tracking
    refund: {
      isRefunded: { type: Boolean, default: false },
      refundAmount: { type: Number, default: 0 },
      refundReason: { type: String },
      refundedAt: { type: Date },
      refundTransactionId: { type: String },
      initiatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin
    },

    // Receipt
    receiptUrl: { type: String },
    receiptSentAt: { type: Date },

    // For recurring
    billingPeriod: {
      month: { type: Number }, // 1-12
      year: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1, paymentType: 1 });
paymentSchema.index({ paidBy: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentNumber: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
