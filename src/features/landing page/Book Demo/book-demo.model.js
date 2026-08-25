import mongoose from 'mongoose';

const demoRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    program: {
      type: String,
      required: [true, 'Program is required'],
      trim: true,
    },
    slot: {
      raw: { type: String, required: true },
      type: { type: String, enum: ['callback', 'scheduled'] },
      dateString: { type: String },
      timePreference: { type: String },
    },
    goal: {
      type: String,
      required: [true, 'Goal is required'],
      trim: true,
    },
    experience_level: {
      type: String,
      required: [true, 'Experience level is required'],
      trim: true,
    },
    utm_source: {
      type: String,
      trim: true,
    },
    utm_medium: {
      type: String,
      trim: true,
    },
    utm_campaign: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema);
