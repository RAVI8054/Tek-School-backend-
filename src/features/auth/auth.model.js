import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ALL_ROLES, ROLES } from '../../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: `Role must be one of: ${ALL_ROLES.join(', ')}`,
      },
      default: ROLES.STUDENT,
    },
    studentPanelSessionId: {
      type: String,
      select: false,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook — hash password whenever it is modified
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  // Clear reset fields on deliberate password change
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }
});

// ─────────────────────────────────────────────────────────────
// Instance methods
// ─────────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 */
userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Returns true if the password was changed AFTER the JWT was issued.
 * Used in the protect middleware.
 */
userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtIssuedAt < changedTimestamp;
  }
  return false;
};

/**
 * Generates a raw reset token, stores its SHA-256 hash in the DB,
 * and sets a 10-minute expiry. Returns the RAW token (sent in email).
 */
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return rawToken;
};

export const User = mongoose.model('User', userSchema);
