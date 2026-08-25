import { z } from 'zod';

export const createProgramSchema = z.object({
  body: z.object({
    title: z.string().min(3).trim(),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    thumbnail: z.string().url().optional(),
    coverImage: z.string().url().optional(),
    category: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    durationMonths: z.number().min(0).optional(),
    totalHours: z.number().min(0).optional(),
    placementPercentage: z.number().min(0).max(100).optional(),
    startingSalaryRange: z
      .object({
        min: z.number(),
        max: z.number(),
        currency: z.string().default('INR'),
        unit: z.string().default('LPA'),
      })
      .optional(),
    hiringPartnersCount: z.number().min(0).optional(),
    highlights: z
      .array(
        z.object({
          icon: z.string().optional(),
          title: z.string(),
          description: z.string(),
        })
      )
      .optional(),
    price: z.number().min(0).optional(),
    discountedPrice: z.number().min(0).optional(),
    currency: z.string().default('INR').optional(),
    instructors: z
      .array(
        z.object({
          name: z.string(),
          title: z.string().optional(),
          avatarUrl: z.string().url().optional(),
        })
      )
      .optional(),
    skills: z.array(z.string()).optional(),
    badge: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaImage: z.string().url().optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProgramSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
  body: createProgramSchema.shape.body.partial(),
});

export const getProgramSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
});

export const listProgramsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
});
