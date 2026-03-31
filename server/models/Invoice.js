// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 10. INVOICE
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Booking (booking), Student (student), Payment (payment)
//   - Belongs to: Booking
// ────────────────────────────────────────────────────────────────────────────

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // INV-2026-00001
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Invoice details
    invoiceType: {
      type: String,
      enum: ["initial_payment", "monthly_rent", "additional_bill", "one_time"],
      required: true,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String }, // deposit, key_money, rent, water, electricity
      },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },

    // Dates
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    billingPeriod: {
      from: { type: Date },
      to: { type: Date },
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled", "void"],
      default: "draft",
    },

    // Linked payment
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    paidAt: { type: Date },

    // Recurrence
    isRecurring: { type: Boolean, default: false },
    recurringSchedule: {
      type: String,
      enum: ["monthly", "quarterly", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ booking: 1, status: 1 });
invoiceSchema.index({ student: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
