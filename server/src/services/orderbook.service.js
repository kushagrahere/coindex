'use strict';

/**
 * Order Book Service — Generates realistic bid/ask depth from a mid price (INR)
 *
 * Simulation model:
 *  - 15 levels on each side (bids + asks)
 *  - Spread: 0.03–0.06% of mid price (realistic for major crypto on Indian exchanges)
 *  - Depth: larger quantities near mid, tapering logarithmically away
 *  - Gaussian noise on price increments to avoid uniform laddering
 *  - Quantities sized to reflect realistic INR volume (1 BTC ≈ ₹85L, so sizes are fractional)
 */

const LEVELS = 15;

/**
 * Box-Muller transform — Gaussian random number (mean=0, sd=1)
 */
const gaussianRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * Generate a full order book snapshot for a given symbol and mid-price
 *
 * @param {string} symbol  — e.g. 'BTC-INR'
 * @param {number} midPriceInr — current CoinGecko price in INR
 * @param {number} volumeInr — 24h volume in INR (used to scale quantity sizes)
 * @returns {{ bids, asks, spread, spreadPct, midPrice, timestamp }}
 */
const generateOrderBook = (symbol, midPriceInr, volumeInr = 0) => {
  if (!midPriceInr || midPriceInr <= 0) {
    return { symbol, bids: [], asks: [], spread: 0, spreadPct: 0, midPrice: 0, timestamp: Date.now() };
  }

  // Spread: 0.03%–0.06% of mid, with small random jitter each call
  const spreadPct = 0.0003 + Math.random() * 0.0003;
  const halfSpread = midPriceInr * spreadPct / 2;

  const bestBid = midPriceInr - halfSpread;
  const bestAsk = midPriceInr + halfSpread;

  // Typical qty per level — scale from volume and price
  // Aim for realistic INR order sizes (e.g. ₹50k–₹5L per level)
  const baseLevelValueInr = Math.max(50000, volumeInr / 200000);
  const baseQty = baseLevelValueInr / midPriceInr;

  const bids = [];
  const asks = [];

  // Price step between levels: 0.02%–0.05% of mid, with Gaussian noise
  const stepPct = (0.0002 + Math.random() * 0.0003);

  for (let i = 0; i < LEVELS; i++) {
    // Price: each level moves away from best bid/ask
    // Add slight Gaussian noise to the step to avoid artificial uniformity
    const noise = 1 + gaussianRandom() * 0.1;
    const levelStep = midPriceInr * stepPct * (i + 1) * noise;

    const bidPrice = parseFloat((bestBid - levelStep * i).toFixed(2));
    const askPrice = parseFloat((bestAsk + levelStep * i).toFixed(2));

    // Qty tapers logarithmically: large near mid, small at edges
    const qtyMultiplier = Math.max(0.05, 1 / (1 + i * 0.4)) * (1 + gaussianRandom() * 0.15);
    const qty = parseFloat((baseQty * qtyMultiplier).toFixed(6));

    if (bidPrice > 0) bids.push([bidPrice, qty]);
    if (askPrice > 0) asks.push([askPrice, qty]);
  }

  const spread = parseFloat((bestAsk - bestBid).toFixed(2));

  return {
    symbol,
    bids,                                    // [[price, qty], ...] highest first
    asks,                                    // [[price, qty], ...] lowest first
    spread,
    spreadPct: parseFloat((spreadPct * 100).toFixed(4)),
    midPrice: parseFloat(midPriceInr.toFixed(2)),
    bestBid: parseFloat(bestBid.toFixed(2)),
    bestAsk: parseFloat(bestAsk.toFixed(2)),
    timestamp: Date.now(),
  };
};

/**
 * Apply micro price drift between order book refreshes
 * Returns a price ±0.01% of the input (sub-500ms micro-movement)
 */
const applyMicroDrift = (price) => {
  const drift = 1 + (Math.random() - 0.5) * 0.0002;
  return price * drift;
};

module.exports = { generateOrderBook, applyMicroDrift };
