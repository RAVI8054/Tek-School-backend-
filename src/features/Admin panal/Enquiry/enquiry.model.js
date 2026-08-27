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
      trim: true,
    },
    slot: {
      raw: { type: String },
      type: { type: String, enum: ['callback', 'scheduled'] },
      dateString: { type: String },
      timePreference: { type: String },
    },
    education: {
      type: String,
      trim: true,
    },
    inquiry_type: {
      type: String,
      enum: [
        'book demo',
        'talk to counselor',
        'enroll',
        'workshop',
        'school',
        'college',
        'ai lab',
      ],
      required: [true, 'Inquiry type is required'],
    },
    institution_name: {
      type: String,
      trim: true,
    },
    school_name: {
      type: String,
      trim: true,
    },
    workshop_name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'new',
        'in_progress',
        'scheduled',
        'rescheduled',
        'completed',
        'enrolled',
        'rejected',
        'junk',
      ],
      default: 'new',
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmed_slot: {
      date: { type: Date },
      time: { type: String },
    },
    rejection_reason: {
      type: String,
      trim: true,
    },
    admin_notes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema);
