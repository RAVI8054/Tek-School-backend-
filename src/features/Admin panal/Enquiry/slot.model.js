import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    date: {
      type: String, // stored as 'YYYY-MM-DD'
      required: [true, 'Date is required'],
    },
    times: {
      type: [String], // e.g. ['09:00', '10:30', '14:00']
      required: [true, 'At least one time slot is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one time slot is required',
      },
    },
    label: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Prevent duplicate date entries — one document per date
slotSchema.index({ date: 1 }, { unique: true });

export const Slot = mongoose.model('Slot', slotSchema);
