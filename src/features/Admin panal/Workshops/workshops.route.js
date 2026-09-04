import express from 'express';
import {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  bookWorkshop,
  uploadWorkshopImage,
  getAllWorkshopBookings,
  getMyWorkshopBookings,
  updateWorkshopBooking,
  deleteWorkshopBooking,
} from './workshops.controller.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { uploadImage } from '../../../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes (anyone can view workshops)
router.get('/', getAllWorkshops);

// Protected routes
router.get('/my-bookings', protect, getMyWorkshopBookings);
router.post('/:id/book', protect, bookWorkshop);

// Protected Admin routes
router.post(
  '/upload-image',
  protect,
  restrictTo('admin'),
  uploadImage.single('image'),
  uploadWorkshopImage
);
router.get('/bookings', protect, restrictTo('admin'), getAllWorkshopBookings);
router.patch(
  '/bookings/:id',
  protect,
  restrictTo('admin'),
  updateWorkshopBooking
);
router.delete(
  '/bookings/:id',
  protect,
  restrictTo('admin'),
  deleteWorkshopBooking
);
router.post('/', protect, restrictTo('admin'), createWorkshop);

// Important: Put /:id parameter routes at the end so they don't swallow specific routes like /bookings
router.get('/:id', getWorkshopById);

export default router;
