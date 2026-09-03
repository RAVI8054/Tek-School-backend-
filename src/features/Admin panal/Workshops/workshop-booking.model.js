import mongoose from 'mongoose';

const workshopBookingSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Free'],
      required: true,
    },
    paymentId: { type: String }, // e.g., Razorpay payment_id

    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Attended'],
      default: 'Confirmed',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const WorkshopBooking = mongoose.model(
  'WorkshopBooking',
  workshopBookingSchema
);
