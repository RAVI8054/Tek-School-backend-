import { z } from 'zod';

const baseUserSchema = {
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().trim().toLowerCase(),
};

const passwordMatchRefine = [
  (data) => data.password === data.passwordConfirm,
  {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  },
];

// ==============================================================
// PUBLIC VALIDATIONS
// ==============================================================
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(1),
    clientType: z.enum(['landingPage', 'studentPanel']).optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email().trim().toLowerCase() }),
});

export const resetPasswordSchema = z
  .object({
    body: z.object({
      token: z.string(),
      password: z.string().min(8),
      passwordConfirm: z.string(),
    }),
  })
  .refine(...passwordMatchRefine);

// ==============================================================
// SPECIFIC ROLE CREATION SCHEMAS
// ==============================================================

export const registerFinanceSchema = z.object({
  body: z.object({
    ...baseUserSchema,
  }),
});

export const registerInstructorSchema = z.object({
  body: z.object({
    ...baseUserSchema,
    bio: z.string().optional(),
  }),
});

export const registerAdmissionsSchema = z.object({
  body: z.object({
    ...baseUserSchema,
  }),
});

export const registerStudentSchema = z.object({
  body: z.object({
    ...baseUserSchema,
    clientType: z.enum(['landingPage', 'studentPanel']).optional(),
    track: z.string().optional(),
    cohort: z.string().optional(),
    city: z.string().optional(),
  }),
});

// ==============================================================
// SPECIFIC ROLE UPDATE SCHEMAS
// ==============================================================
export const updateGenericUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).trim().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).trim().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    track: z.string().optional(),
    cohort: z.string().optional(),
    city: z.string().optional(),
    attendance: z.number().min(0).max(100).optional(),
    completion: z.number().min(0).max(100).optional(),
  }),
});
