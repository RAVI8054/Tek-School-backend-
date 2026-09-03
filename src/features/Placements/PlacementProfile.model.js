import mongoose from 'mongoose';

const placementProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    whyHireMe: { type: String },
    resumeReviewed: { type: Boolean, default: false },
    portfolioLive: { type: Boolean, default: false },
    mockInterviewsCompleted: { type: Number, default: 0 },
    applicationsSent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PlacementProfile = mongoose.model(
  'PlacementProfile',
  placementProfileSchema
);
