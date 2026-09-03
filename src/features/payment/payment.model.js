import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Ensure you have a User model or change this reference
      required: true,
    },
    // Polymorphic associations for the item being paid for
    paymentFor: {
      type: String,
      enum: ['Course', 'Workshop', 'Other'],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // RefPath allows dynamic reference based on paymentFor
      refPath: 'paymentFor',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Wallet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
      required: true,
    },
    // Provider specific fields (e.g. Razorpay)
    providerOrderId: {
      type: String,
      // Optional, as wallet payments might not have this
    },
    providerPaymentId: {
      type: String,
    },
    providerSignature: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
