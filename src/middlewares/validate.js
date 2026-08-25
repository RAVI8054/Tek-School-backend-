import { ZodError } from 'zod';
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
      if (err instanceof ZodError) {
        // If validation fails, format the Zod issues into a readable string
        const errorMessages = err.issues
          .map((e) => {
            const path = e.path.join('.');
            return path ? `${path}: ${e.message}` : e.message;
          })
          .join(', ');
        return next(new AppError(`Validation error - ${errorMessages}`, 400));
      }
      return next(new AppError(err.message || 'Validation failed', 400));
    }
  };
};
