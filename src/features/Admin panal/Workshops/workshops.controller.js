import { Workshop } from './workshops.model.js';
import { WorkshopBooking } from './workshop-booking.model.js';
import { AppError } from '../../../utils/AppError.js';
import { UploadService } from '../../../services/upload/upload.service.js';
import { InstructorProfile } from '../../Instructor/Profile/instructor-profile.model.js';
import mongoose from 'mongoose';

// Create a new workshop
export const createWorkshop = async (req, res, next) => {
  try {
    const {
      title,
      blurb,
      about,
      track,
      format,
      startTime,
      endTime,
      durationText,
      totalSeats,
      isFree,
      price, // Expected { amount, currency }
      imageUrl,
      host, // InstructorProfile ID
      takeaways,
      forWho,
      prerequisites,
      agenda,
      featured,
      status,
    } = req.body;

    if (!host) {
      return next(
        new AppError(
          'Instructor (host) ID must be provided in the request body.',
          400
        )
      );
    }

    // `host` from frontend is the User ObjectId. We need the InstructorProfile ObjectId.
    const instructorProfile = await InstructorProfile.findOne({ userId: host });
    if (!instructorProfile) {
      return next(
        new AppError(
          'No instructor profile found for the provided host user ID.',
          404
        )
      );
    }

    const newWorkshop = await Workshop.create({
      title,
      blurb,
      about,
      track,
      format,
      startTime,
      endTime,
      durationText,
      totalSeats,
      availableSeats: totalSeats, // Initially all seats are available
      isFree,
      price,
      imageUrl,
      host: instructorProfile._id,
      takeaways,
      forWho,
      prerequisites,
      agenda,
      featured,
      status,
    });

    res.status(201).json({
      status: 'success',
      data: {
        workshop: newWorkshop,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all workshops (Public or Admin)
export const getAllWorkshops = async (req, res, next) => {
  try {
    const workshops = await Workshop.find().populate({
      path: 'host',
      populate: {
        path: 'userId',
        select: 'name email',
      },
    });

    res.status(200).json({
      status: 'success',
      results: workshops.length,
      data: {
        workshops,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all workshop bookings (Admin)
export const getAllWorkshopBookings = async (req, res, next) => {
  try {
    const bookings = await WorkshopBooking.find()
      .populate('user', 'name email')
      .populate('workshop', 'title track')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's workshop bookings
export const getMyWorkshopBookings = async (req, res, next) => {
  try {
    const bookings = await WorkshopBooking.find({ user: req.user._id })
      .populate('workshop', 'title track startTime imageUrl durationText')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update workshop booking (Admin)
export const updateWorkshopBooking = async (req, res, next) => {
  try {
    const booking = await WorkshopBooking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true, runValidators: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'Booking not found' });
    }
    res.status(200).json({ status: 'success', data: { booking } });
  } catch (error) {
    next(error);
  }
};

// Delete workshop booking (Admin)
export const deleteWorkshopBooking = async (req, res, next) => {
  try {
    const booking = await WorkshopBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'Booking not found' });
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// Get a single workshop
export const getWorkshopById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id).populate({
      path: 'host',
      populate: {
        path: 'userId',
        select: 'name email',
      },
    });

    if (!workshop) {
      return next(new AppError('No workshop found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        workshop,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Book a workshop
export const bookWorkshop = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workshopId = req.params.id;
    const userId = req.user._id; // Assuming auth middleware sets req.user

    const workshop = await Workshop.findById(workshopId).session(session);

    if (!workshop) {
      throw new AppError('No workshop found with that ID', 404);
    }

    if (workshop.availableSeats <= 0) {
      throw new AppError('This workshop is completely booked out.', 400);
    }

    // Check if user already booked
    const existingBooking = await WorkshopBooking.findOne({
      workshop: workshopId,
      user: userId,
    }).session(session);
    if (existingBooking) {
      throw new AppError('You have already booked this workshop.', 400);
    }

    // Decrement seats
    workshop.availableSeats -= 1;
    await workshop.save({ session });

    // Payment Logic - Placeholder for actual gateway integration
    let paymentStatus = 'Pending';
    let amountPaid = 0;

    if (workshop.isFree || (workshop.price && workshop.price.amount === 0)) {
      paymentStatus = 'Free';
    }

    // In a real scenario with razorpay, you might create a Razorpay order here,
    // and return the order details, leaving the booking as Pending.
    // If the user provided a payment ID in req.body, process it.
    if (req.body.paymentId) {
      paymentStatus = 'Completed';
      amountPaid = workshop.price ? workshop.price.amount : 0;
    }

    const booking = await WorkshopBooking.create(
      [
        {
          workshop: workshopId,
          user: userId,
          paymentStatus,
          paymentId: req.body.paymentId,
          status: 'Confirmed',
          amountPaid,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: 'success',
      data: {
        booking: booking[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Upload Workshop Cover Image
export const uploadWorkshopImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image file.', 400));
    }

    const fileBuffer = req.file.buffer;
    const publicId = `workshop_cover_${Date.now()}`;

    const imageUrl = await UploadService.upload(
      fileBuffer,
      'workshops',
      publicId
    );

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
