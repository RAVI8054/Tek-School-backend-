import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      required: true,
    },
    stage: {
      type: String,
      enum: [
        'Applied',
        'Screening',
        'Interview',
        'Offer',
        'Placed',
        'Rejected',
      ],
      default: 'Applied',
    },
    rejectedAtStage: { type: String }, // Records the stage the student was at before rejection
  },
  { timestamps: true }
);

export const JobApplication = mongoose.model(
  'JobApplication',
  jobApplicationSchema
);
