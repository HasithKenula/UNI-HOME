import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceProviderReviewSchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

serviceProviderReviewSchema.index({ provider: 1, createdAt: -1 });
serviceProviderReviewSchema.index({ provider: 1, reviewer: 1 });

const ServiceProviderReview = mongoose.model('ServiceProviderReview', serviceProviderReviewSchema);

export default ServiceProviderReview;
