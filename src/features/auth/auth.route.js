import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from './auth.controller.js';
import { protect, restrictTo } from './auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import * as valid from './auth.validation.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

/** Strict limiter for login — 15 attempts per 10 minutes per IP */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
});

/** Softer limiter for forgot-password — 5 requests per 15 minutes per IP */
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

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password, passwordConfirm }
 * Restricted to: ADMIN, ADMISSIONS
 * Returns: created user data
 */
router.post(
  '/register',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.ADMISSIONS),
  validate(valid.registerSchema),
  ctrl.register
);

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

/**
 * POST /api/v1/auth/refresh-token
 * Requires: refresh_token cookie
 * Returns: new accessToken (+ sets new httpOnly cookies)
 */
router.post('/refresh-token', ctrl.refreshToken);

export default router;
