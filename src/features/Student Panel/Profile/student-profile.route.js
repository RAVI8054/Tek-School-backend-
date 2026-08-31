import express from 'express';
import * as profileController from './student-profile.controller.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES } from '../../../config/roles.js';
import { uploadImage } from '../../../middlewares/upload.middleware.js';

const router = express.Router();

// Apply auth middleware - only students can access their profile
router.use(protect);
router.use(restrictTo(ROLES.STUDENT));

router
  .route('/')
  .get(profileController.getProfile)
  .patch(profileController.updateProfile);

router.post(
  '/avatar',
  uploadImage.single('avatar'),
  profileController.uploadAvatar
);

export default router;
