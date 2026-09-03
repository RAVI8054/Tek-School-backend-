import mongoose from 'mongoose';

const salesTeamProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SalesTeamProfile = mongoose.model(
  'SalesTeamProfile',
  salesTeamProfileSchema
);
