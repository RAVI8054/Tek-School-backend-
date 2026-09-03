import mongoose from 'mongoose';

const agendaSchema = new mongoose.Schema(
  {
    time: { type: String, required: true }, // e.g., "0:00"
    label: { type: String, required: true }, // e.g., "Introduction"
  },
  { _id: false }
);

const workshopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    blurb: { type: String, required: true, maxlength: 200 },
    about: { type: String, required: true },

    track: {
      type: String,
      enum: [
        'AI Engineering',
        'Cloud Engineering',
        'Software Engineering',
        'Future Engineering',
      ],
      required: true,
    },
    format: {
      type: String,
      enum: ['In person', 'Online', 'Hybrid'],
      required: true,
    },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationText: { type: String },

    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true, min: 0 },

    isFree: { type: Boolean, default: false },
    price: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },

    imageUrl: { type: String, required: true },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstructorProfile',
      required: true,
    },

    takeaways: [{ type: String }],
    forWho: [{ type: String }],
    prerequisites: { type: String },
    agenda: [agendaSchema],

    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Completed', 'Cancelled'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

export const Workshop = mongoose.model('Workshop', workshopSchema);
