'use strict';

/**
 * Market Routes — Full Implementation (Phase 2)
 *
 * GET /api/v1/market/assets           — paginated INR asset list
 * GET /api/v1/market/ticker/:id       — single asset ticker
 * GET /api/v1/market/ohlcv/:id        — OHLCV candles (TradingView-compatible)
 * GET /api/v1/market/trending         — top gainers & losers
 * GET /api/v1/market/search           — fuzzy search by name/symbol
 * GET /api/v1/market/orderbook/:id    — current order book snapshot (REST fallback)
 * GET /api/v1/market/health           — engine status
 */

const { Router } = require('express');
const marketService = require('../services/market.service');
const { generateOrderBook } = require('../services/orderbook.service');
const priceEngine = require('../engine/priceEngine');
const { ASSETS } = require('../config/assets');
const { marketLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();
router.use(marketLimiter);

// ── GET /assets ───────────────────────────────────────────────────────────────
router.get('/assets', asyncHandler(async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)     || 1);
  const perPage  = Math.min(50, parseInt(req.query.per_page) || 20);
  const category = req.query.category || null;
  const sortBy   = req.query.sort || 'rank';           // rank | change24h | priceInr | volumeInr
  const sortDir  = req.query.dir === 'asc' ? 1 : -1;

  let assets = await marketService.getMarkets();

  // Filter by category
  if (category) {
    assets = assets.filter(a => a.category === category);
  }

  // Sort
  const sortMap = { rank: 'rank', change24h: 'change24h', price: 'priceInr', volume: 'volumeInr' };
  const sortKey = sortMap[sortBy] || 'rank';
  assets = [...assets].sort((a, b) => sortDir * (a[sortKey] - b[sortKey]));

  // Paginate
  const total = assets.length;
  const pages = Math.ceil(total / perPage);
  const data  = assets.slice((page - 1) * perPage, page * perPage);

  return res.json({
    success: true,
    data,
    meta: { page, perPage, total, pages },
  });
}));

// ── GET /ticker/:id ───────────────────────────────────────────────────────────
router.get('/ticker/:id', asyncHandler(async (req, res) => {
  const asset = await marketService.getTicker(req.params.id);
  if (!asset) {
    return res.status(404).json({ success: false, error: 'Asset not found.' });
  }
  return res.json({ success: true, data: asset });
}));

// ── GET /ohlcv/:id ────────────────────────────────────────────────────────────
router.get('/ohlcv/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const days = parseInt(req.query.days) || 1;

  if (![1, 7, 14, 30, 90, 365].includes(days)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid days param. Allowed: 1, 7, 14, 30, 90, 365',
    });
  }

  const candles = await marketService.getOHLCV(id, days);
  return res.json({
    success: true,
    data: candles,
    meta: { id, days, count: candles.length, currency: 'INR' },
  });
}));

// ── GET /trending ─────────────────────────────────────────────────────────────
router.get('/trending', asyncHandler(async (req, res) => {
  const data = await marketService.getTrending();
  return res.json({ success: true, data });
}));

// ── GET /search?q= ────────────────────────────────────────────────────────────
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ success: false, error: 'Query param q is required.' });
  }
  const results = await marketService.searchAssets(q);
  return res.json({ success: true, data: results });
}));

// ── GET /orderbook/:id ────────────────────────────────────────────────────────
// REST fallback for clients that can't use WebSocket
router.get('/orderbook/:id', asyncHandler(async (req, res) => {
  const asset = await marketService.getTicker(req.params.id);
  if (!asset) {
    return res.status(404).json({ success: false, error: 'Asset not found.' });
  }
  const orderBook = generateOrderBook(asset.pair, asset.priceInr, asset.volumeInr);
  return res.json({ success: true, data: orderBook });
}));

// ── GET /categories ───────────────────────────────────────────────────────────
router.get('/categories', (_, res) => {
  const categories = [...new Set(ASSETS.map(a => a.category))];
  return res.json({ success: true, data: categories });
});

// ── GET /health ───────────────────────────────────────────────────────────────
router.get('/health', (_, res) => {
  const prices = priceEngine.getAllPrices();
  res.json({
    success: true,
    data: {
      status: 'online',
      assetsLoaded: prices.length,
      samplePrice: prices[0] ? `${prices[0].name}: ₹${prices[0].priceInr.toLocaleString('en-IN')}` : 'no data',
    },
  });
});

module.exports = router;
