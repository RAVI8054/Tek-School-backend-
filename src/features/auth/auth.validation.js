import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// LOGIN VALIDATION
// ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
    clientType: z
      .enum(['landingPage', 'studentPanel'], {
        required_error: 'Client type is required (landingPage or studentPanel)',
        invalid_type_error:
          'Client type must be either landingPage or studentPanel',
      })
      .optional(),
  }),
});

// ─────────────────────────────────────────────────────────────
// REGISTER VALIDATION
// ─────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(80, 'Name cannot exceed 80 characters')
        .trim(),
      email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email address')
        .trim()
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long'),
      passwordConfirm: z.string({
        required_error: 'Password confirmation is required',
      }),
      clientType: z
        .enum(['landingPage', 'studentPanel'], {
          required_error:
            'Client type is required (landingPage or studentPanel)',
          invalid_type_error:
            'Client type must be either landingPage or studentPanel',
        })
        .optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),
});

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD VALIDATION
// ─────────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
  }),
});

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD VALIDATION
// ─────────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string({ required_error: 'Reset token is required' }),
      password: z
        .string({ required_error: 'New password is required' })
        .min(8, 'Password must be at least 8 characters long'),
      passwordConfirm: z.string({
        required_error: 'Password confirmation is required',
      }),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'], // Assigns the error to the passwordConfirm field
    }),
});
