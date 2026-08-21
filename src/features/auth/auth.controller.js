import { catchAsync } from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';

// ─── Cookie configuration ──────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true, // not accessible via JS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Attaches access_token and refresh_token as httpOnly cookies
 * and also returns the access token in the JSON response body
 * (convenient for mobile / non-browser clients).
 */
const sendTokenResponse = (
  res,
  statusCode,
  { user, accessToken, refreshToken },
  message
) => {
  res.cookie('access_token', accessToken, COOKIE_OPTIONS);
  res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

  const responseBody = {
    status: 'success',
    token: accessToken, // kept for API / mobile clients
    data: { user },
  };

  if (message) {
    responseBody.message = message;
  }

  res.status(statusCode).json(responseBody);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.registerUser(name, email, password);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = catchAsync(async (req, res) => {
  const { email, password, clientType } = req.body;
  const result = await authService.loginUser(email, password, clientType);
  sendTokenResponse(res, 200, result);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.user?.id);

  // Overwrite cookies with empty values and immediate expiry
  res.cookie('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.cookie('refresh_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';

  await authService.forgotPassword(email, clientUrl);

  // Always respond with the same message (anti-enumeration)
  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a reset link has been sent.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  const result = await authService.resetPassword(token, password);
  sendTokenResponse(res, 200, result, 'Password reset successfully.');
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/refresh-token
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refresh_token;
  const result = await authService.refreshTokenService(token);
  sendTokenResponse(res, 200, result);
});
