import express from 'express';
import {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  bookWorkshop,
  uploadWorkshopImage,
} from './workshops.controller.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { uploadImage } from '../../../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes (anyone can view workshops)
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshopById);

// Protected Student routes
router.post('/:id/book', protect, bookWorkshop);

// Protected Admin routes
router.post(
  '/upload-image',
  protect,
  restrictTo('admin'),
  uploadImage.single('image'),
  uploadWorkshopImage
);
router.post('/', protect, restrictTo('admin'), createWorkshop);

export default router;
