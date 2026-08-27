import { AppError } from '../../../utils/AppError.js';

export const checkCommunityAccess = (req, res, next) => {
  if (req.user && req.user.isBlocked) {
    return next(
      new AppError('Your community access has been revoked by an admin.', 403)
    );
  }
  next();
};
