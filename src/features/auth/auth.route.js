import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from './auth.controller.js';
import { protect, restrictTo } from './auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import * as valid from './auth.validation.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'fail',
    message:
      'Too many password-reset requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// Create, Edit, Delete Finance
router.post(
  '/finance',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.registerFinanceSchema),
  ctrl.createFinance
);
router.patch(
  '/finance/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.updateGenericUserSchema),
  ctrl.updateFinance
);
router.delete(
  '/finance/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.deleteFinance
);

// Create, Edit, Delete Instructor
router.post(
  '/instructor',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.registerInstructorSchema),
  ctrl.createInstructor
);
router.get(
  '/instructor',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.getAllInstructors
);
router.patch(
  '/instructor/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.updateGenericUserSchema),
  ctrl.updateInstructor
);
router.delete(
  '/instructor/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.deleteInstructor
);

// Create, Edit, Delete Admissions
router.post(
  '/admissions',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.registerAdmissionsSchema),
  ctrl.createAdmissions
);
router.patch(
  '/admissions/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.updateGenericUserSchema),
  ctrl.updateAdmissions
);
router.delete(
  '/admissions/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.deleteAdmissions
);

// Create, Read, Edit, Delete Sales Team
router.post(
  '/salesteam',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.registerSalesTeamSchema),
  ctrl.createSalesTeam
);
router.get(
  '/salesteam',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.getAllSalesTeam
);
router.patch(
  '/salesteam/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  validate(valid.updateSalesTeamSchema),
  ctrl.updateSalesTeam
);
router.delete(
  '/salesteam/:id',
  protect,
  restrictTo(ROLES.ADMIN),
  ctrl.deleteSalesTeam
);

// ==============================================================================
// 2. ADMISSIONS & ADMIN ROUTES (Manage Students)
// ==============================================================================

router.post(
  '/student',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  validate(valid.registerStudentSchema),
  ctrl.createStudent
);
router.get(
  '/student',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  ctrl.getAllStudents
);
router.get(
  '/student/:id',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  ctrl.getStudentById
);
router.patch(
  '/student/:id',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  validate(valid.updateStudentSchema),
  ctrl.updateStudent
);
router.delete(
  '/student/:id',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  ctrl.deleteStudent
);

// ==============================================================================
// 3. PUBLIC & GENERAL AUTH ROUTES (Login, Logout, Passwords)
// ==============================================================================

router.post('/login', loginLimiter, validate(valid.loginSchema), ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.post(
  '/forgot-password',
  forgotLimiter,
  validate(valid.forgotPasswordSchema),
  ctrl.forgotPassword
);
router.patch(
  '/reset-password',
  validate(valid.resetPasswordSchema),
  ctrl.resetPassword
);
router.post('/refresh-token', ctrl.refreshToken);

export default router;
