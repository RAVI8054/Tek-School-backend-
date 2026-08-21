import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: String,
    shortDescription: String,
    thumbnail: String,
    level: {
      type: String,
      enum: ['foundation', 'core', 'advanced', 'capstone'],
    },
    durationHours: { type: Number, default: 0, min: 0 },
    learningOutcomes: [String],
    prerequisites: [String],
    skills: [String],
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ program: 1, sortOrder: 1 });

export const Course = mongoose.model('Course', courseSchema);
