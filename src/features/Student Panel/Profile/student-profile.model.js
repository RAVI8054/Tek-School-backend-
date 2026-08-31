import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    track: {
      type: String,
      trim: true,
      default: '',
    },
    cohort: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    profile_img: {
      type: String,
      default: '',
    },
    createdChannelsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCommunityBlocked: {
      type: Boolean,
      default: false,
    },
    communityBlockReason: {
      type: String,
      trim: true,
      default: '',
    },
    communityBlockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model(
  'StudentProfile',
  studentProfileSchema
);
