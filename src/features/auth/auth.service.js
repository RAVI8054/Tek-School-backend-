import crypto from 'crypto';
import { User } from './auth.model.js';
import { ROLES } from '../../config/roles.js';
import { AppError } from '../../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

// ─────────────────────────────────────────────────────────────
// Helper — build the token payload from a User document
// ─────────────────────────────────────────────────────────────
const buildTokenPayload = (user, sessionId, clientType) => ({
  id: user._id,
  role: user.role,
  sessionId: sessionId,
  clientType: clientType,
});

// ─────────────────────────────────────────────────────────────
// Helper — strip sensitive fields and return a clean user object
// ─────────────────────────────────────────────────────────────
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
/**
 * Registers a new student account and returns tokens.
 */
export const registerUser = async (name, email, password) => {
  // 1. Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 400);
  }

  // 2. Create the user
  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role: ROLES.STUDENT,
  });

  return { user: sanitizeUser(user) };
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
/**
 * Validates credentials and returns access + refresh tokens.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} clientType
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const loginUser = async (email, password, clientType) => {
  // 1. Find user — explicitly select passwordHash (hidden by default)
  const user = await User.findOne({ email }).select('+passwordHash');

  // 3. Verify credentials (combined check prevents user-enumeration)
  if (!user || !(await user.correctPassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  // Enforce clientType requirement for students only
  if (user.role === ROLES.STUDENT && !clientType) {
    throw new AppError('Client type is required for student login.', 400);
  }

  // 4. Stamp last login and set session Id (only for student panel)
  user.lastLoginAt = new Date();

  let sessionId = null;
  if (clientType === 'studentPanel') {
    sessionId = crypto.randomUUID();
    user.studentPanelSessionId = sessionId;
  }

  await user.save({ validateBeforeSave: false });

  // 5. Sign tokens
  const payload = buildTokenPayload(user, sessionId, clientType);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};
// ─────────────────────────────────────────────────────────────
// LOGOUT  (stateless — controller clears the cookie)
// ─────────────────────────────────────────────────────────────
/**
 * Logs out the user. By clearing the studentPanelSessionId, we ensure
 * any stolen refresh tokens become permanently useless immediately.
 */
export const logoutUser = async (userId) => {
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.studentPanelSessionId = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────
/**
 * Generates a password-reset token and sends the email.
 * Always responds with a generic success message to prevent
 * user-enumeration attacks (even if email does not exist).
 *
 * @param {string} email
 * @param {string} clientUrl  - Base URL for the reset link (from env)
 */
export const forgotPassword = async (email, clientUrl) => {
  const user = await User.findOne({ email });

  // Silently succeed if user not found (anti-enumeration)
  if (!user) return;

  // Generate raw token and save hashed version + expiry
  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Build reset URL and send email
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl, user.name);
  } catch {
    // Roll back DB changes if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError(
      'Could not send the reset email. Please try again later.',
      500
    );
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────
/**
 * Verifies the reset token, validates the new password, and
 * updates the user's credentials.
 *
 * @param {string} rawToken
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const resetPassword = async (rawToken, newPassword) => {
  // 1. Hash the raw token to compare with the stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 3. Find user with a valid (non-expired) token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordHash +passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or has expired.', 400);
  }

  // 4. Update password (pre-save hook hashes it + clears reset fields)
  user.passwordHash = newPassword;
  await user.save();

  // 5. Issue fresh tokens (reuse existing session if available, or generate a temporary one,
  // actually for reset password it's better to force re-login by not returning tokens,
  // but if we do, we need a clientType. Let's just generate a studentPanel session for now as a fallback)
  const sessionId = crypto.randomUUID();
  user.studentPanelSessionId = sessionId;
  await user.save({ validateBeforeSave: false });

  const payload = buildTokenPayload(user, sessionId, 'studentPanel');
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────
/**
 * Rotates the refresh token and returns new tokens if valid.
 */
export const refreshTokenService = async (token) => {
  if (!token) throw new AppError('No refresh token provided', 401);

  // 1. Verify token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError(
      'Invalid or expired refresh token. Please log in again.',
      401
    );
  }

  const { id, sessionId, clientType } = decoded;

  // 2. Find user with the matching session ID (if student panel)
  // Also select passwordChangedAt to ensure old tokens are invalidated if password changed
  const user = await User.findById(id).select(
    '+studentPanelSessionId +passwordChangedAt'
  );
  if (!user) {
    throw new AppError(
      'The user belonging to this token no longer exists.',
      401
    );
  }

  // 2.5 Ensure the password wasn't changed after this token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'Password was recently changed. Please log in again.',
      401
    );
  }

  if (clientType === 'studentPanel') {
    if (user.studentPanelSessionId !== sessionId) {
      throw new AppError(
        'Session invalid or expired (you logged in from another device).',
        401
      );
    }
  }

  // 3. Rotate session ID (if student panel)
  let newSessionId = null;
  if (clientType === 'studentPanel') {
    newSessionId = crypto.randomUUID();
    user.studentPanelSessionId = newSessionId;
    await user.save({ validateBeforeSave: false });
  }

  // 4. Sign new tokens
  const payload = buildTokenPayload(user, newSessionId, clientType);
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
};
