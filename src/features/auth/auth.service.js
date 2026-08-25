import crypto from 'crypto';
import { User } from './auth.model.js';
import { ROLES } from '../../config/roles.js';
import { AppError } from '../../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../../utils/email.js';

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
const buildTokenPayload = (user, sessionId, clientType) => ({
  id: user._id,
  role: user.role,
  sessionId: sessionId,
  clientType: clientType,
});

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────
// SPECIFIC ROLE CREATION / UPDATE / DELETE (Industrial Level)
// ─────────────────────────────────────────────────────────────

/**
 * Generic factory for creating users of a specific role
 */
export const createUserWithRole = async (userData, role) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 400);
  }

  // Generate a random 12-character alphanumeric password
  const generatedPassword = crypto.randomBytes(6).toString('hex');

  const user = await User.create({
    ...userData,
    passwordHash: generatedPassword,
    role,
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  const loginUrl = `${clientUrl}/login`; // Modify this route according to your frontend setup

  // Send the welcome email with credentials
  try {
    await sendWelcomeEmail(
      user.email,
      user.name,
      user.role,
      generatedPassword,
      loginUrl
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send welcome email:', error);
    // Even if the email fails, the user is created. We can just return the generated password.
  }

  return {
    user: sanitizeUser(user),
    generatedPassword,
  };
};

export const updateGenericUser = async (id, updateData, allowedRole) => {
  const userToUpdate = await User.findById(id);
  if (!userToUpdate) throw new AppError('User not found', 404);

  // Ensure we are updating a user of the correct role (e.g. don't update admin via finance route)
  if (userToUpdate.role !== allowedRole) {
    throw new AppError(
      `Cannot update user. Expected role: ${allowedRole}`,
      403
    );
  }

  if (updateData.email) {
    const existingUser = await User.findOne({
      email: updateData.email,
      _id: { $ne: id },
    });
    if (existingUser)
      throw new AppError('An account with this email already exists.', 400);
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  return { user: sanitizeUser(user) };
};

export const deleteGenericUser = async (id, allowedRole) => {
  const userToDelete = await User.findById(id);
  if (!userToDelete) throw new AppError('User not found', 404);

  if (userToDelete.role !== allowedRole) {
    throw new AppError(
      `Cannot delete user. Expected role: ${allowedRole}`,
      403
    );
  }

  await User.findByIdAndDelete(id);
  return true;
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
export const loginUser = async (email, password, clientType) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !(await user.correctPassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  if (user.role === ROLES.STUDENT && !clientType) {
    throw new AppError('Client type is required for student login.', 400);
  }

  user.lastLoginAt = new Date();
  let sessionId = null;
  if (clientType === 'studentPanel') {
    sessionId = crypto.randomUUID();
    user.studentPanelSessionId = sessionId;
  }

  await user.save({ validateBeforeSave: false });

  const payload = buildTokenPayload(user, sessionId, clientType);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
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
export const forgotPassword = async (email, clientUrl) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl, user.name);
  } catch {
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
export const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordHash +passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or has expired.', 400);
  }

  user.passwordHash = newPassword;
  await user.save();

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
export const refreshTokenService = async (token) => {
  if (!token) throw new AppError('No refresh token provided', 401);

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

  const user = await User.findById(id).select(
    '+studentPanelSessionId +passwordChangedAt'
  );
  if (!user) {
    throw new AppError(
      'The user belonging to this token no longer exists.',
      401
    );
  }

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

  let newSessionId = null;
  if (clientType === 'studentPanel') {
    newSessionId = crypto.randomUUID();
    user.studentPanelSessionId = newSessionId;
    await user.save({ validateBeforeSave: false });
  }

  const payload = buildTokenPayload(user, newSessionId, clientType);
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
};
