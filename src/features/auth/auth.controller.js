import { catchAsync } from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';
import { ROLES } from '../../config/roles.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Must be 'none' if frontend and backend are on different domains (e.g., Vercel and Render)
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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
    token: accessToken,
    data: { user },
  };
  if (message) responseBody.message = message;
  res.status(statusCode).json(responseBody);
};

// ==============================================================
// FACTORY CONTROLLERS FOR ROLE CREATION (Industrial Level)
// ==============================================================

const createRoleController = (role) =>
  catchAsync(async (req, res) => {
    const result = await authService.createUserWithRole(req.body, role);
    res.status(201).json({ status: 'success', data: result });
  });

const updateRoleController = (role) =>
  catchAsync(async (req, res) => {
    const result = await authService.updateGenericUser(
      req.params.id,
      req.body,
      role
    );
    res.status(200).json({ status: 'success', data: result });
  });

const deleteRoleController = (role) =>
  catchAsync(async (req, res) => {
    await authService.deleteGenericUser(req.params.id, role);
    res
      .status(200)
      .json({ status: 'success', message: 'User deleted successfully.' });
  });

// ─────────────────────────────────────────────────────────────
// FINANCE Management
// ─────────────────────────────────────────────────────────────
export const createFinance = createRoleController(ROLES.FINANCE);
export const updateFinance = updateRoleController(ROLES.FINANCE);
export const deleteFinance = deleteRoleController(ROLES.FINANCE);

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR Management
// ─────────────────────────────────────────────────────────────
export const createInstructor = createRoleController(ROLES.INSTRUCTOR);
export const updateInstructor = updateRoleController(ROLES.INSTRUCTOR);
export const deleteInstructor = deleteRoleController(ROLES.INSTRUCTOR);

// ─────────────────────────────────────────────────────────────
// ADMISSIONS Management
// ─────────────────────────────────────────────────────────────
export const createAdmissions = createRoleController(ROLES.ADMISSIONS);
export const updateAdmissions = updateRoleController(ROLES.ADMISSIONS);
export const deleteAdmissions = deleteRoleController(ROLES.ADMISSIONS);

// ─────────────────────────────────────────────────────────────
// STUDENT Management
// ─────────────────────────────────────────────────────────────
export const createStudent = createRoleController(ROLES.STUDENT);
export const updateStudent = updateRoleController(ROLES.STUDENT);
export const deleteStudent = deleteRoleController(ROLES.STUDENT);

// ==============================================================
// PUBLIC AUTH CONTROLLERS
// ==============================================================

export const login = catchAsync(async (req, res) => {
  const { email, password, clientType } = req.body;
  const result = await authService.loginUser(email, password, clientType);
  sendTokenResponse(res, 200, result);
});

export const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.user?.id);
  res.cookie('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.cookie('refresh_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully.' });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  await authService.forgotPassword(email, clientUrl);
  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a reset link has been sent.',
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  sendTokenResponse(res, 200, result, 'Password reset successfully.');
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refresh_token;
  const result = await authService.refreshTokenService(token);
  sendTokenResponse(res, 200, result);
});
