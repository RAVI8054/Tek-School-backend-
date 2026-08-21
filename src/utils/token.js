import jwt from 'jsonwebtoken';

/**
 * Signs a short-lived access token (default 15 min).
 * Payload should contain at minimum: { id, role }
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Signs a long-lived refresh token (default 7 days).
 * Stored in an httpOnly cookie — never exposed to JS.
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verifies a JWT against the given secret.
 * Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on failure.
 */
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

/**
 * Convenience — verify an access token.
 */
export const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET);
};

/**
 * Convenience — verify a refresh token.
 */
export const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET);
};
