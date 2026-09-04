import express from 'express';
import {
  initiatePayment,
  verifyPayment,
  razorpayWebhook,
  guestCheckout,
} from './payment.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = express.Router();

// Webhook route must NOT be protected by user auth, as it is called by Razorpay's servers
router.post('/webhook', razorpayWebhook);

// Guest checkout route
router.post('/guest-checkout', guestCheckout);

// User-facing endpoints
router.post('/initiatepayment', protect, initiatePayment);
router.post('/verifypayment', protect, verifyPayment);

export default router;
