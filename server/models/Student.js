// ============================================================================
// SLIIT Student Accommodation Management System
// MongoDB Database Schema (Mongoose)
// Version: 1.0 | March 2026
// ============================================================================

import mongoose from "mongoose";
const { Schema } = mongoose;
import User from "./User.js";

// ────────────────────────────────────────────────────────────────────────────
// 2. STUDENT (Extends User)
// ────────────────────────────────────────────────────────────────────────────
// Relations:
//   - References: User (inherits)
//   - Referenced by: Bookings, Reviews, MaintenanceTickets, ListingReports
//   - Has many: Bookings, Reviews, MaintenanceTickets, Favorites
// ────────────────────────────────────────────────────────────────────────────

const studentSchema = new Schema({
  sliitEmail: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@my\.sliit\.lk$/, "Must be a valid SLIIT email"],
  },
  studentId: { type: String, required: true, unique: true }, // e.g., IT23822580
  batch: { type: String }, // e.g., Y2S2
  faculty: { type: String }, // e.g., Computing
  favorites: [{ type: Schema.Types.ObjectId, ref: "Accommodation" }],
});

const Student = User.discriminator("student", studentSchema);

export default Student;
