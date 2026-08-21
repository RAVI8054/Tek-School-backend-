import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: String,
    type: {
      type: String,
      enum: [
        'video',
        'article',
        'live_class',
        'assignment',
        'quiz',
        'project',
        'resource',
      ],
      required: true,
    },
    content: String,
    videoUrl: String,
    durationMinutes: { type: Number, default: 0, min: 0 },
    resources: [
      {
        title: String,
        url: String,
        type: { type: String },
      },
    ],
    sortOrder: { type: Number, default: 0 },
    isFreePreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, sortOrder: 1 });

export const Lesson = mongoose.model('Lesson', lessonSchema);
