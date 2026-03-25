import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceBookingSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'],
      index: true,
    },
    district: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    preferredDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled', 'accepted'],
      default: 'pending',
      index: true,
    },
    completedAt: { type: Date },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

serviceBookingSchema.index({ owner: 1, status: 1, createdAt: -1 });
serviceBookingSchema.index({ provider: 1, status: 1, createdAt: -1 });

const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);

export default ServiceBooking;
