// Global error handler
// Catches errors thrown in controllers/services and sends clean JSON responses
export const errorHandler = (err, _req, res, _next) => {
  console.error('❌ Error:', err.message);

  // Custom errors thrown with a statusCode (from services)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma "record not found" error
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Prisma unique constraint violation (e.g. email already exists)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // Fallback: 500 internal server error
  res.status(500).json({ error: 'Internal server error' });
};

// Helper to create errors with a specific status code
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
