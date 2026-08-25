import { z } from 'zod';

export const bookDemoSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').max(100).trim(),
    email: z.string().email('Valid email is required').trim().toLowerCase(),
    phone: z.string().min(5, 'Phone number is required').trim(),
    program: z.string().min(1, 'Program is required').trim(),
    slot: z.string().min(1, 'Slot is required').trim(),
    goal: z.string().min(1, 'Goal is required').trim(),
    experience_level: z.string().min(1, 'Experience level is required').trim(),
    utm_source: z.string().trim().optional(),
    utm_medium: z.string().trim().optional(),
    utm_campaign: z.string().trim().optional(),
  }),
});
