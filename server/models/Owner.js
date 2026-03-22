// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;
const User = require("./User");

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

module.exports = Owner;
