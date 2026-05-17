'use strict';

const { verifyAccessToken } = require('../utils/jwt');

/**
 * authenticate — JWT Bearer token verification middleware
 * Attaches decoded payload to req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Provide a Bearer token.',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: isExpired ? 'Token expired. Please refresh.' : 'Invalid token.',
      code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }
};

/**
 * requireRole — role-based access control guard
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions.',
    });
  }
  return next();
};

module.exports = { authenticate, requireRole };
