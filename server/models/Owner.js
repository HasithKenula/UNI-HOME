// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;
import User from "./User.js";

// ────────────────────────────────────────────────────────────────────────────
// 3. OWNER (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: Accommodations (owner field)
//   - Has many: Accommodations
// ────────────────────────────────────────────────────────────────────────────

const ownerSchema = new Schema({
  nic: { type: String, required: true, unique: true },
  bankDetails: {
    bankName: { type: String },
    branchName: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
  },
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified",
  },
  verificationDocuments: [
    {
      documentType: {
        type: String,
        enum: ["nic_copy", "property_deed", "business_registration", "other"],
      },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  verificationNote: { type: String }, // admin note on approval/rejection
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin who verified
});

const Owner = User.discriminator("owner", ownerSchema);

export default Owner;
