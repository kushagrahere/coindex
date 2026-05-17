'use strict';

const rateLimit = require('express-rate-limit');

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60),
      }),
    ...options,
  });

// Global — 200 requests per 15 minutes per IP
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

// Auth routes — tighter to prevent brute force / credential stuffing
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true, // only count failed attempts
});

// Market data — generous, these are cacheable
const marketLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
});

// Trade execution — strict
const tradeLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
});

module.exports = { globalLimiter, authLimiter, marketLimiter, tradeLimiter };
