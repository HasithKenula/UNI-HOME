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
      trim: true,
      maxlength: 120,
    },
    reviewerEmail: {
      type: String,
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
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categoryRatings: {
      responsiveness: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

serviceProviderReviewSchema.index({ provider: 1, createdAt: -1 });
serviceProviderReviewSchema.index({ provider: 1, reviewer: 1 });

const ServiceProviderReview = mongoose.model('ServiceProviderReview', serviceProviderReviewSchema);

export default ServiceProviderReview;
