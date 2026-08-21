import { AppError } from '../utils/AppError.js';

/**
 * Middleware to validate request data (body, query, params) against a Zod schema.
 *
 * @param {import('zod').AnyZodObject} schema - The Zod schema to validate against
 */
export const validate = (schema) => {
  return (req, _res, next) => {
    try {
      // Parse and validate the request
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers, // Include headers for schemas that require it
      });
      next();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        // If validation fails, format the Zod errors into a readable string
        const errorMessages = err.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return next(new AppError(`Validation failed - ${errorMessages}`, 400));
      }
      return next(new AppError(err.message || 'Validation failed', 400));
    }
  };
};
