'use strict';

const env = require('../config/env');

/**
 * Centralized error handler — must be registered LAST in Express middleware chain.
 * Logs detailed errors in dev, returns sanitized JSON in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Always log full error server-side
  console.error(`[error] ${req.method} ${req.path} → ${status}:`, err.message);
  if (env.IS_DEV && err.stack) {
    console.error(err.stack);
  }

  // Sanitize response payload
  const payload = {
    success: false,
    error: status < 500 ? err.message : 'An internal server error occurred.',
    code: err.code || undefined,
  };

  // Attach stack trace only in dev
  if (env.IS_DEV && status >= 500) {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
};

/**
 * 404 handler — register before errorHandler
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Async wrapper — eliminates try/catch boilerplate in route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, notFound, asyncHandler };
