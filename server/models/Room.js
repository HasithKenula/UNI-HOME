// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;

// ────────────────────────────────────────────────────────────────────────────
// 7. ROOM (Individual units within an accommodation)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: Accommodation (accommodation)
//   - Referenced by: Bookings (room)
//   - Belongs to: Accommodation
// ────────────────────────────────────────────────────────────────────────────

const roomSchema = new Schema(
  {
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    roomNumber: { type: String, required: true },
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "shared", "studio"],
    },
    floor: { type: Number, default: 0 },
    maxOccupants: { type: Number, default: 1 },
    currentOccupants: { type: Number, default: 0 },

    // Room-specific pricing override (optional)
    monthlyRent: { type: Number }, // overrides accommodation pricing if set

    // Room-specific facilities
    hasAttachedBathroom: { type: Boolean, default: false },
    hasAirConditioning: { type: Boolean, default: false },
    isFurnished: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },

    // Current tenant tracking (denormalized)
    currentTenants: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User" },
        booking: { type: Schema.Types.ObjectId, ref: "Booking" },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ accommodation: 1, status: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;
