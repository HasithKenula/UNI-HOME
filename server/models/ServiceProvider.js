// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;
import User from "./User.js";

// ────────────────────────────────────────────────────────────────────────────
// 4. SERVICE PROVIDER (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: MaintenanceTickets (assignedProvider)
//   - Has many: assigned MaintenanceTickets
// ────────────────────────────────────────────────────────────────────────────

const serviceProviderSchema = new Schema({
  nic: { type: String, required: true, unique: true },
  serviceCategories: [
    {
      type: String,
      enum: ["plumbing", "electrical", "cleaning", "painting", "carpentry", "general", "other"],
    },
  ],
  areasOfOperation: [
    {
      district: { type: String },
      cities: [{ type: String }],
    },
  ],
  certifications: [
    {
      name: { type: String },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verificationNote: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalTasksCompleted: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
});

const ServiceProvider = User.discriminator("service_provider", serviceProviderSchema);

export default ServiceProvider;
