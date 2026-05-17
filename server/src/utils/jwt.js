'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

/**
 * Sign a short-lived access token (15min default)
 * Payload: { sub: userId, email, username, role }
 */
const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' }
  );
};

/**
 * Sign a long-lived refresh token (7d default)
 * Payload: { sub: userId, jti: UUID } — jti stored in sessions table
 */
const signRefreshToken = (userId) => {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: userId, jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, algorithm: 'HS256' }
  );
  return { token, jti };
};

/**
 * Verify an access token — throws on invalid/expired
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
};

/**
 * Verify a refresh token — throws on invalid/expired
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
