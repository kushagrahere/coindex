'use strict';

const { Router } = require('express');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  const result = authService.register(req.body, meta);
  return res.status(201).json({ success: true, data: result });
}));

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  const result = authService.login(req.body, meta);
  return res.status(200).json({ success: true, data: result });
}));

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const meta = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  const result = authService.refresh(refreshToken, meta);
  return res.status(200).json({ success: true, data: result });
}));

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const result = authService.logout(req.user.id);
  return res.status(200).json({ success: true, data: result });
}));

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const result = authService.getMe(req.user.id);
  return res.status(200).json({ success: true, data: result });
}));

module.exports = router;
