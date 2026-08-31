import { AppError } from '../../../utils/AppError.js';
import { StudentProfile } from '../Profile/student-profile.model.js';
import { catchAsync } from '../../../utils/catchAsync.js';

export const checkCommunityAccess = catchAsync(async (req, res, next) => {
  if (req.user) {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (profile && profile.isCommunityBlocked) {
      return next(
        new AppError('Your community access has been revoked by an admin.', 403)
      );
    }
  }
  next();
});
