import { catchAsync } from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';
import { ROLES } from '../../config/roles.js';
import { StudentProfile } from '../Student Panel/Profile/student-profile.model.js';
import { InstructorProfile } from '../Instructor/Profile/instructor-profile.model.js';
import { User } from './auth.model.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
export const createInstructor = catchAsync(async (req, res) => {
  const { bio, ...userData } = req.body;
  const result = await authService.createUserWithRole(
    userData,
    ROLES.INSTRUCTOR
  );

  await InstructorProfile.create({
    userId: result.user.id,
    bio: bio || '',
  });

  res.status(201).json({ status: 'success', data: result });
});

export const getAllInstructors = catchAsync(async (req, res) => {
  const users = await User.find({ role: ROLES.INSTRUCTOR })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const profiles = await InstructorProfile.find({
    userId: { $in: userIds },
  }).lean();

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.userId] = p;
    return acc;
  }, {});

  const instructors = users.map((user) => {
    const p = profileMap[user._id] || {};
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      track: 'Unassigned',
      cohorts: [],
      upcomingSessions: 0,
      rating: 5,
      bio: p.bio || '',
    };
  });

  res.status(200).json({ status: 'success', data: { instructors } });
});

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
export const createStudent = catchAsync(async (req, res) => {
  const { track, cohort, city, ...userData } = req.body;
  const result = await authService.createUserWithRole(userData, ROLES.STUDENT);

  await StudentProfile.create({
    userId: result.user.id,
    track: track || '',
    cohort: cohort || '',
    city: city || '',
  });

  res.status(201).json({ status: 'success', data: result });
});
export const updateStudent = updateRoleController(ROLES.STUDENT);
export const deleteStudent = deleteRoleController(ROLES.STUDENT);

export const getAllStudents = catchAsync(async (req, res) => {
  const users = await User.find({ role: ROLES.STUDENT })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const profiles = await StudentProfile.find({
    userId: { $in: userIds },
  }).lean();

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.userId] = p;
    return acc;
  }, {});

  const students = users.map((user) => {
    const p = profileMap[user._id] || {};
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      track: p.track || 'Unassigned',
      cohort: p.cohort || 'Unassigned',
      city: p.city || 'Unknown',
      enrolledAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isCommunityBlocked: p.isCommunityBlocked || false,
      attendance: 100,
      completion: 0,
      placement: 'Not started',
      atRisk: false,
      phone: '+91 90000 00000',
    };
  });

  res.status(200).json({ status: 'success', data: { students } });
});

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
  const clientUrl =
    req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
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
