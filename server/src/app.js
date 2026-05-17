'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route modules
const authRoutes   = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const tradeRoutes  = require('./routes/trade.routes');

const createApp = () => {
  const app = express();

  // ── Security Headers ─────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled — client served separately
    crossOriginEmbedderPolicy: false,
  }));

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.options('*', cors()); // pre-flight

  // ── Body Parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // ── Request Logging ───────────────────────────────────────────────────────
  app.use(morgan(env.IS_DEV ? 'dev' : 'combined'));

  // ── Global Rate Limit ─────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Health Check (unauthenticated) ────────────────────────────────────────
  app.get('/api/v1/health', (_, res) => {
    res.json({
      success: true,
      data: {
        service: 'Coindex API',
        version: '1.0.0',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/v1/auth',   authRoutes);
  app.use('/api/v1/market', marketRoutes);
  app.use('/api/v1/trade',  tradeRoutes);

  // ── 404 & Error Handlers (must be last) ──────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
