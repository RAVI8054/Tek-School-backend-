import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';
import { User } from '../../auth/auth.model.js';
import { StudentProfile } from './student-profile.model.js';
import { UploadService } from '../../../services/upload/upload.service.js';

/**
 * Get current student profile
 */
export const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let profile = await StudentProfile.findOne({ userId }).lean();
  if (!profile) {
    // Fallback if profile doesn't exist
    profile = {
      track: '',
      cohort: '',
      city: '',
      phone: '',
      bio: '',
      profile_img: '',
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      profile: {
        name: user.name,
        email: user.email,
        phone: profile.phone || '',
        cohort: profile.cohort || '',
        track: profile.track || '',
        location: profile.city || '', // Map city to location for frontend
        bio: profile.bio || '',
        profile_img: profile.profile_img || '',
      },
    },
  });
});

/**
 * Update current student profile
 * (Ignoring email and cohort updates as they are admin-assigned)
 */
export const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { name, phone, location, bio } = req.body;

  // 1. Update User model (name)
  if (name) {
    await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    );
  }

  // 2. Update StudentProfile model (phone, city/location, bio)
  const profileUpdates = {};
  if (phone !== undefined) profileUpdates.phone = phone;
  if (location !== undefined) profileUpdates.city = location;
  if (bio !== undefined) profileUpdates.bio = bio;

  await StudentProfile.findOneAndUpdate(
    { userId },
    profileUpdates,
    { new: true, upsert: true, runValidators: true } // upsert creates it if missing
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
  });
});

/**
 * Upload Avatar
 */
export const uploadAvatar = catchAsync(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  const fileBuffer = req.file.buffer;
  const publicId = `student_avatar_${userId}_${Date.now()}`;

  // Upload using our abstract service
  const avatarUrl = await UploadService.upload(fileBuffer, 'avatars', publicId);

  // Save URL in StudentProfile
  await StudentProfile.findOneAndUpdate(
    { userId },
    { profile_img: avatarUrl },
    { upsert: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Avatar uploaded successfully',
    data: {
      avatarUrl,
    },
  });
});
