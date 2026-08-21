import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: String,
    moduleNumber: { type: Number, required: true },
    durationHours: { type: Number, default: 0, min: 0 },
    skills: [String],
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseModuleSchema.index({ course: 1, moduleNumber: 1 }, { unique: true });

export const CourseModule = mongoose.model('CourseModule', courseModuleSchema);
