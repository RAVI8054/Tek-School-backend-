import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: String,
    description: String,
    thumbnail: String,
    category: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    durationMonths: { type: Number, min: 0 },
    totalHours: { type: Number, min: 0 },
    placementPercentage: { type: Number, min: 0, max: 100 },
    startingSalaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' },
      unit: { type: String, default: 'LPA' },
    },
    hiringPartnersCount: { type: Number, default: 0 },
    highlights: [
      {
        icon: String,
        title: String,
        description: String,
      },
    ],

    // --- Added for optimized frontend display ---
    price: { type: Number, default: 0 },
    discountedPrice: { type: Number },
    currency: { type: String, default: 'INR' },
    instructors: [
      {
        name: String,
        title: String,
        avatarUrl: String,
      },
    ],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    skills: [String],
    // --------------------------------------------

    // --- Visual & SEO Additions ---
    coverImage: String,
    badge: String, // E.g., "Bestseller", "New"

    // SEO Fields
    metaTitle: String,
    metaDescription: String,
    metaImage: String,
    // --------------------------------------------

    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Program = mongoose.model('Program', programSchema);
