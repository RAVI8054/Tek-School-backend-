import { catchAsync } from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';
import { ROLES } from '../../config/roles.js';
import { StudentProfile } from '../Student Panel/Profile/student-profile.model.js';
import { InstructorProfile } from '../Instructor/Profile/instructor-profile.model.js';
import { SalesTeamProfile } from '../Sales Team/Profile/salesteam-profile.model.js';
import { User } from './auth.model.js';
import { WorkshopBooking } from '../Admin panal/Workshops/workshop-booking.model.js';
import { Payment } from '../payment/payment.model.js';

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
// SALES TEAM Management
// ─────────────────────────────────────────────────────────────
export const createSalesTeam = catchAsync(async (req, res) => {
  const { bio, ...userData } = req.body;
  const result = await authService.createUserWithRole(
    userData,
    ROLES.SALES_TEAM
  );

  await SalesTeamProfile.create({
    userId: result.user.id,
    bio: bio || '',
  });

  res.status(201).json({ status: 'success', data: result });
});

export const updateSalesTeam = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const userId = req.params.id;

  const userUpdates = {};
  if (name !== undefined) userUpdates.name = name;
  if (email !== undefined) userUpdates.email = email;

  const result = await authService.updateGenericUser(
    userId,
    userUpdates,
    ROLES.SALES_TEAM
  );

  const profileUpdates = {};
  if (bio !== undefined) profileUpdates.bio = bio;

  await SalesTeamProfile.findOneAndUpdate({ userId }, profileUpdates, {
    new: true,
    upsert: true,
  });

  res.status(200).json({ status: 'success', data: result });
});

export const deleteSalesTeam = deleteRoleController(ROLES.SALES_TEAM);

export const getAllSalesTeam = catchAsync(async (req, res) => {
  const users = await User.find({ role: ROLES.SALES_TEAM })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const profiles = await SalesTeamProfile.find({
    userId: { $in: userIds },
  }).lean();

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.userId] = p;
    return acc;
  }, {});

  const salesTeam = users.map((user) => {
    const p = profileMap[user._id] || {};
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: p.bio || '',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  });

  res.status(200).json({ status: 'success', data: { salesTeam } });
});

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
export const updateStudent = catchAsync(async (req, res) => {
  const { track, cohort, city, name, email } = req.body;
  const userId = req.params.id;

  // 1. Update core User data
  const userUpdates = {};
  if (name !== undefined) userUpdates.name = name;
  if (email !== undefined) userUpdates.email = email;

  const result = await authService.updateGenericUser(
    userId,
    userUpdates,
    ROLES.STUDENT
  );

  // 2. Update Student Profile
  const profileUpdates = {};
  if (track !== undefined) profileUpdates.track = track;
  if (cohort !== undefined) profileUpdates.cohort = cohort;
  if (city !== undefined) profileUpdates.city = city;
  if (req.body.attendance !== undefined)
    profileUpdates.attendance = req.body.attendance;
  if (req.body.completion !== undefined)
    profileUpdates.completion = req.body.completion;
  if (req.body.placement !== undefined)
    profileUpdates.placement = req.body.placement;
  if (req.body.atRisk !== undefined) profileUpdates.atRisk = req.body.atRisk;
  if (req.body.isCommunityBlocked !== undefined)
    profileUpdates.isCommunityBlocked = req.body.isCommunityBlocked;

  await StudentProfile.findOneAndUpdate({ userId }, profileUpdates, {
    new: true,
    upsert: true,
  });

  res.status(200).json({ status: 'success', data: result });
});
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

  const students = users
    .map((user) => {
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
        phone: p.phone || '',
        profile_img: p.profile_img || '',
      };
    })
    .filter((s) => s.track !== 'Workshop Only');

  res.status(200).json({ status: 'success', data: { students } });
});

export const getStudentById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== ROLES.STUDENT) {
    return res
      .status(404)
      .json({ status: 'fail', message: 'Student not found' });
  }

  const profile = await StudentProfile.findOne({ userId: user._id });

  const workshopBookings = await WorkshopBooking.find({ user: user._id })
    .populate('workshop', 'title track startTime imageUrl durationText')
    .sort({ createdAt: -1 });

  const payments = await Payment.find({ user: user._id }).sort({
    createdAt: -1,
  });

  const studentData = {
    id: user._id,
    name: user.name,
    email: user.email,
    track: profile?.track || 'Unassigned',
    cohort: profile?.cohort || 'Unassigned',
    city: profile?.city || 'Unknown',
    enrolledAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    isCommunityBlocked: profile?.isCommunityBlocked || false,
    attendance: 100,
    completion: 0,
    placement: 'Not started',
    atRisk: false,
    phone: profile?.phone || '',
    profile_img: profile?.profile_img || '',
  };

  res.status(200).json({
    status: 'success',
    data: {
      student: studentData,
      workshopBookings,
      payments,
    },
  });
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
