'use strict';

require('dotenv').config();

const required = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_PATH',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  DB_PATH: process.env.DB_PATH || './data/coindex.db',

  COINGECKO_BASE_URL: process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
  COINGECKO_CACHE_TTL_MS: parseInt(process.env.COINGECKO_CACHE_TTL_MS, 10) || 30000,

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  SEED_INR_BALANCE: parseFloat(process.env.SEED_INR_BALANCE) || 1000000,

  IS_DEV: process.env.NODE_ENV !== 'production',
};
