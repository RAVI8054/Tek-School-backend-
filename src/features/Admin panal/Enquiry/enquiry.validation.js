import { z } from 'zod';

export const bookDemoSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').max(100).trim(),
    email: z.string().email('Valid email is required').trim().toLowerCase(),
    phone: z.string().min(5, 'Phone number is required').trim(),
    program: z.string().trim().optional(),
    slot: z.string().trim().optional(),
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
    utm_source: z.string().trim().optional(),
    utm_medium: z.string().trim().optional(),
    utm_campaign: z.string().trim().optional(),
  }),
});

export const updateEnquirySchema = z.object({
  body: z.object({
    status: z
      .enum(['pending', 'in_progress', 'completed', 'junk'], {
        errorMap: () => ({
          message: 'Status must be pending, in_progress, completed, or junk',
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
  }),
});

export const addAdminNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note cannot be empty'),
  }),
});

export const getEnquiriesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'junk']).optional(),
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
