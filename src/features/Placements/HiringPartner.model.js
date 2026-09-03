import mongoose from 'mongoose';

const hiringPartnerSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    track: { type: String, trim: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    activeRoles: { type: Number, default: 0 },
    hires: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const HiringPartner = mongoose.model(
  'HiringPartner',
  hiringPartnerSchema
);
