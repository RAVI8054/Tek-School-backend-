// Global error handler middleware
export const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // Provide stack trace only in development, not production
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
