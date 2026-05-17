'use strict';

/**
 * Trade Routes — Phase 2/4 placeholder
 * Will power:
 *   POST /api/v1/trade/order           — place BUY/SELL order (MARKET/LIMIT)
 *   GET  /api/v1/trade/history         — user's trade history
 *   GET  /api/v1/trade/pnl             — aggregate P&L per asset in INR
 *   GET  /api/v1/trade/open            — open orders
 *   DELETE /api/v1/trade/order/:id     — cancel limit order
 */

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { tradeLimiter } = require('../middleware/rateLimiter');

const router = Router();
router.use(authenticate, tradeLimiter);

router.get('/health', (_, res) => {
  res.json({
    success: true,
    data: { status: 'Trade engine online — Phase 4 pending.' },
  });
});

module.exports = router;
