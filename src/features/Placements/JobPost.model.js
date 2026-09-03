import mongoose from 'mongoose';

const jobPostSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    logoDomain: { type: String, trim: true },
    track: { type: String, trim: true },
    location: { type: String, trim: true },
    salary: { type: String, trim: true },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    skills: [{ type: String, trim: true }],
    about: { type: String },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    benefits: [{ type: String }],
  },
  { timestamps: true }
);

export const JobPost = mongoose.model('JobPost', jobPostSchema);
