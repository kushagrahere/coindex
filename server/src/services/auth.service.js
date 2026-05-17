'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');
const env = require('../config/env');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

const createHttpError = (status, message, code) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.created_at,
});

const getExpiresAt = (durationStr) => {
  const units = { m: 60, h: 3600, d: 86400 };
  const match = durationStr.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid duration: ${durationStr}`);
  const seconds = parseInt(match[1]) * units[match[2]];
  return new Date(Date.now() + seconds * 1000).toISOString();
};

// ── Auth Service ──────────────────────────────────────────────────────────────

const register = (dto, meta = {}) => {
  const { email, username, password } = dto;

  if (!email || !username || !password) {
    throw createHttpError(400, 'email, username and password are required.', 'VALIDATION_ERROR');
  }
  if (password.length < 8) {
    throw createHttpError(400, 'Password must be at least 8 characters.', 'WEAK_PASSWORD');
  }

  const emailLower = email.toLowerCase().trim();
  const d = db();

  const existing = d.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).get(emailLower, username);

  if (existing) {
    throw createHttpError(409, 'Email or username already in use.', 'DUPLICATE_USER');
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  const createUser = d.transaction(() => {
    const { lastInsertRowid: userId } = d.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    ).run(emailLower, username.trim(), passwordHash);

    d.prepare(
      "INSERT INTO wallets (user_id, asset, balance) VALUES (?, 'INR', ?)"
    ).run(userId, env.SEED_INR_BALANCE);

    return d.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  });

  const user = createUser();
  return _issueTokens(user, meta);
};

const login = (dto, meta = {}) => {
  const { email, password } = dto;

  if (!email || !password) {
    throw createHttpError(400, 'email and password are required.', 'VALIDATION_ERROR');
  }

  const d = db();
  const user = d.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw createHttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw createHttpError(403, 'Account suspended. Contact support.', 'ACCOUNT_SUSPENDED');
  }

  return _issueTokens(user, meta);
};

const refresh = (oldRefreshToken, meta = {}) => {
  if (!oldRefreshToken) {
    throw createHttpError(401, 'Refresh token required.', 'NO_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw createHttpError(401, 'Invalid or expired refresh token.', 'INVALID_REFRESH_TOKEN');
  }

  const d = db();
  const session = d.prepare(
    'SELECT * FROM sessions WHERE id = ? AND revoked = 0'
  ).get(payload.jti);

  if (!session || new Date(session.expires_at) < new Date()) {
    throw createHttpError(401, 'Session expired or revoked.', 'SESSION_EXPIRED');
  }

  const user = d.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
  if (!user || !user.is_active) {
    throw createHttpError(403, 'User account not found or suspended.', 'USER_NOT_FOUND');
  }

  d.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').run(payload.jti);

  return _issueTokens(user, meta);
};

const logout = (userId) => {
  db().prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').run(userId);
  return { message: 'Logged out successfully.' };
};

const getMe = (userId) => {
  const d = db();
  const user = d.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw createHttpError(404, 'User not found.', 'USER_NOT_FOUND');

  const wallets = d.prepare(
    'SELECT asset, balance, locked FROM wallets WHERE user_id = ?'
  ).all(userId);

  return { ...formatUser(user), wallets };
};

// ── Internal ──────────────────────────────────────────────────────────────────

const _issueTokens = (user, meta) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, jti } = signRefreshToken(user.id);
  const expiresAt = getExpiresAt(env.JWT_REFRESH_EXPIRES_IN);

  db().prepare(
    'INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
  ).run(jti, user.id, expiresAt, meta.ip || null, meta.userAgent || null);

  return {
    user: formatUser(user),
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
};

module.exports = { register, login, refresh, logout, getMe };
