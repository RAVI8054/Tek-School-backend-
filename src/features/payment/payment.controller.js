import { Payment } from './payment.model.js';
import razorpayService from '../../services/payment/razorpay.service.js';
import crypto from 'crypto';
import { AppError } from '../../utils/AppError.js';
import { User } from '../auth/auth.model.js';
import { StudentProfile } from '../Student Panel/Profile/student-profile.model.js';
import { WorkshopBooking } from '../Admin panal/Workshops/workshop-booking.model.js';
import { Workshop } from '../Admin panal/Workshops/workshops.model.js';
import { ROLES } from '../../config/roles.js';

export const initiatePayment = async (req, res, next) => {
  try {
    const { paymentFor, itemId, amount, paymentMethod } = req.body;
    const userId = req.user._id; // Assuming user is attached by auth middleware

    if (!['Course', 'Workshop', 'Other'].includes(paymentFor)) {
      return next(new AppError('Invalid paymentFor provided', 400));
    }
    if (paymentMethod !== 'Razorpay') {
      return next(new AppError('Currently only Razorpay is supported', 400));
    }

    // 1. Create a Pending Payment Record in DB
    const newPayment = await Payment.create({
      user: userId,
      paymentFor,
      itemId,
      amount,
      paymentMethod,
      status: 'Pending',
    });

    // 2. Create the order using Razorpay service
    const order = await razorpayService.createOrder(amount, newPayment._id);

    // 4. Update the Payment record with the provider's order ID (if any)
    if (order && order.id) {
      newPayment.providerOrderId = order.id;
      await newPayment.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment: newPayment,
        providerOrder: order,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const guestCheckout = async (req, res, next) => {
  try {
    const { name, email, phone, paymentFor, itemId, amount, paymentMethod } =
      req.body;

    if (!name || !email) {
      return next(
        new AppError('Name and email are required for guest checkout', 400)
      );
    }
    if (!['Course', 'Workshop', 'Other'].includes(paymentFor)) {
      return next(new AppError('Invalid paymentFor provided', 400));
    }
    if (paymentMethod !== 'Razorpay') {
      return next(new AppError('Currently only Razorpay is supported', 400));
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user
      const randomPassword = crypto.randomBytes(8).toString('hex');
      user = await User.create({
        name,
        email,
        passwordHash: randomPassword,
        role: ROLES.STUDENT,
      });

      await StudentProfile.create({
        userId: user._id,
        phone: phone || '',
        track: 'Workshop Only',
      });
    }

    // 1. Create a Pending Payment Record in DB
    const newPayment = await Payment.create({
      user: user._id,
      paymentFor,
      itemId,
      amount,
      paymentMethod,
      status: 'Pending',
    });

    if (paymentFor === 'Workshop') {
      const workshop = await Workshop.findById(itemId);
      if (!workshop) {
        return next(new AppError('Workshop not found', 404));
      }
      if (workshop.availableSeats <= 0) {
        return next(
          new AppError('This workshop is completely booked out.', 400)
        );
      }

      const existingBooking = await WorkshopBooking.findOne({
        workshop: itemId,
        user: user._id,
      });
      if (!existingBooking) {
        // Decrease seats immediately? Maybe not until confirmed, but we'll reserve it for now.
        workshop.availableSeats -= 1;
        await workshop.save();

        await WorkshopBooking.create({
          workshop: itemId,
          user: user._id,
          paymentStatus: 'Pending',
          paymentId: newPayment._id.toString(), // Store our payment record ID as reference for now
          status: 'Confirmed',
          amountPaid: 0,
        });
      }
    }

    // 2. Create the order using Razorpay service
    const order = await razorpayService.createOrder(amount, newPayment._id);

    // 3. Update the Payment record with the provider's order ID (if any)
    if (order && order.id) {
      newPayment.providerOrderId = order.id;
      await newPayment.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment: newPayment,
        providerOrder: order,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId, // Our DB payment record ID
    } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    if (payment.status === 'Completed') {
      return next(new AppError('Payment is already completed', 400));
    }

    // 1. Verify signature/payment using Razorpay service
    const isValid = razorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      payment.status = 'Failed';
      await payment.save();
      return next(new AppError('Payment verification failed', 400));
    }

    // 3. Mark payment as completed
    payment.status = 'Completed';
    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    await payment.save();

    if (payment.paymentFor === 'Workshop') {
      const booking = await WorkshopBooking.findOne({
        workshop: payment.itemId,
        user: payment.user,
      });
      if (booking) {
        booking.paymentStatus = 'Completed';
        booking.amountPaid = payment.amount;
        booking.paymentId = razorpay_payment_id;
        await booking.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: { payment },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const razorpayWebhook = async (req, res, _next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // eslint-disable-next-line no-console
      console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is not defined');
      return res.status(500).send('Webhook Secret Not Configured');
    }

    // Razorpay signature verification requires the raw stringified body
    const bodyString = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    // Find the payment by order ID
    const paymentRecord = await Payment.findOne({ providerOrderId: orderId });

    if (!paymentRecord) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Payment record not found' });
    }

    if (event === 'payment.captured') {
      paymentRecord.status = 'Completed';
      paymentRecord.providerPaymentId = paymentId;
      await paymentRecord.save();
      if (paymentRecord.paymentFor === 'Workshop') {
        const booking = await WorkshopBooking.findOne({
          workshop: paymentRecord.itemId,
          user: paymentRecord.user,
        });
        if (booking) {
          booking.paymentStatus = 'Completed';
          booking.amountPaid = paymentRecord.amount;
          booking.paymentId = paymentId;
          await booking.save();
        }
      }
    } else if (event === 'payment.failed') {
      paymentRecord.status = 'Failed';
      await paymentRecord.save();
      if (paymentRecord.paymentFor === 'Workshop') {
        const booking = await WorkshopBooking.findOne({
          workshop: paymentRecord.itemId,
          user: paymentRecord.user,
        });
        if (booking) {
          booking.paymentStatus = 'Failed';
          await booking.save();
        }
      }
    }

    // Always return 200 OK to acknowledge receipt to Razorpay
    res.status(200).json({ status: 'success' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Webhook Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
