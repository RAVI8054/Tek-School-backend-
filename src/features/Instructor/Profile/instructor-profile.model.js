import mongoose from 'mongoose';
import { ROLES } from '../../../config/roles.js';

const instructorProfileSchema = new mongoose.Schema(
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
      default: '',
    },
    role: {
      type: String,
      trim: true,
      default: ROLES.INSTRUCTOR,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    credentials: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const InstructorProfile = mongoose.model(
  'InstructorProfile',
  instructorProfileSchema
);
