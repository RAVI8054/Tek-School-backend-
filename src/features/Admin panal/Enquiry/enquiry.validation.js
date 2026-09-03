import { z } from 'zod';

export const bookDemoSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').max(100).trim(),
    email: z.string().email('Valid email is required').trim().toLowerCase(),
    phone: z.string().min(5, 'Phone number is required').trim(),
    program: z.string().trim().optional(),
    slot: z
      .object({
        type: z.enum(['scheduled', 'callback']),
        dateString: z.string().trim().optional(),
        timePreference: z.string().trim().optional(),
      })
      .optional(),
    best_time_to_call: z.string().trim().optional(),
    education: z.string().trim().optional(),
    inquiry_type: z.enum(
      [
        'book demo',
        'talk to counselor',
        'enroll',
        'workshop',
        'school',
        'college',
        'ai lab',
      ],
      {
        errorMap: () => ({ message: 'Invalid inquiry type' }),
      }
    ),
    institution_name: z.string().trim().optional(),
    school_name: z.string().trim().optional(),
    workshop_name: z.string().trim().optional(),
  }),
});

export const updateEnquirySchema = z.object({
  body: z.object({
    status: z
      .enum(['new', 'qualified', 'demo', 'follow_ups', 'won', 'lost'], {
        errorMap: () => ({
          message: 'Invalid status provided',
        }),
      })
      .optional(),
    assigned_to: z.string().optional(),
    confirmed_slot: z
      .object({
        date: z.string().optional(),
        time: z.string().optional(),
      })
      .optional(),
    rejection_reason: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const getEnquiriesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.enum(['tekschool', 'admission']).optional(),
    status: z
      .enum(['new', 'qualified', 'demo', 'follow_ups', 'won', 'lost'])
      .optional(),
    inquiry_type: z
      .enum([
        'book demo',
        'talk to counselor',
        'enroll',
        'workshop',
        'school',
        'college',
        'ai lab',
      ])
      .optional(),
    search: z.string().optional(),
  }),
});
