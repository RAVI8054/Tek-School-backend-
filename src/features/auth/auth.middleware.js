import { AppError } from '../../utils/AppError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { verifyAccessToken } from '../../utils/token.js';
import { User } from './auth.model.js';

// ─────────────────────────────────────────────────────────────
// PROTECT — verifies the JWT and attaches req.user
// ─────────────────────────────────────────────────────────────
/**
 * Reads the JWT from:
 *   1. Authorization: Bearer <token>   (API / mobile clients)
 *   2. access_token httpOnly cookie    (browser clients)
 *
 * Attaches the full user document to req.user on success.
 */
export const protect = catchAsync(async (req, _res, next) => {
  // 1. Extract token
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401)
    );
  }

  // 2. Verify signature + expiry
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new AppError('Your session has expired. Please log in again.', 401)
      );
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Confirm user still exists in DB
  const currentUser = await User.findById(decoded.id).select(
    '+studentPanelSessionId'
  );
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 3.5 Check single device session (only for student panel)
  if (decoded.clientType === 'studentPanel' && decoded.sessionId) {
    if (
      currentUser.studentPanelSessionId &&
      currentUser.studentPanelSessionId !== decoded.sessionId
    ) {
      return next(
        new AppError(
          'You have been logged out because you logged in on another device.',
          401
        )
      );
    }
  }

  // 4. Check if password was changed after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was recently changed. Please log in again.', 401)
    );
  }

  // 5. Attach user to request
  req.user = currentUser;
  next();
});

// ─────────────────────────────────────────────────────────────
// RESTRICT TO — role-based access control guard
// ─────────────────────────────────────────────────────────────
/**
 * Factory that returns a middleware restricting access to the
 * specified roles. Import ROLES from config/roles.js to avoid
 * hardcoding strings.
 *
 * Usage:
 *   router.get('/admin-only', protect, restrictTo(ROLES.ADMIN), handler)
 *   router.get('/staff',      protect, restrictTo(...STAFF_ROLES), handler)
 *
 * @param {...string} roles  - Allowed role values
 */
export const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action is restricted to: ${roles.join(', ')}.`,
          403
        )
      );
    }
    next();
  };
};
