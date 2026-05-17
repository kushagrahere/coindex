'use strict';

/**
 * Price Engine — Orchestrates the real-time market data pipeline
 *
 * Responsibilities:
 *  1. Poll CoinGecko every PRICE_POLL_MS (45s) → update cache → broadcast TICKER_BATCH
 *  2. Every ORDERBOOK_POLL_MS (500ms) → generate order book snapshots → broadcast ORDERBOOK
 *  3. Track micro price drift between API polls for lifelike movement
 *  4. Manage WebSocket subscription state per client
 *
 * WebSocket message protocol:
 *
 * Outbound:
 *   { type: 'TICKER_BATCH', data: Asset[], timestamp: ms }
 *   { type: 'ORDERBOOK',    data: OrderBook,  timestamp: ms }
 *   { type: 'PONG',         timestamp: ms }
 *
 * Inbound (from client):
 *   { type: 'SUBSCRIBE',   channels: string[] }    e.g. ['orderbook:BTC-INR']
 *   { type: 'UNSUBSCRIBE', channels: string[] }
 *   { type: 'PING' }
 */

const marketService = require('../services/market.service');
const { generateOrderBook, applyMicroDrift } = require('../services/orderbook.service');
const { ORDERBOOK_PAIRS, ASSET_BY_ID } = require('../config/assets');
const env = require('../config/env');

const PRICE_POLL_MS    = 45_000;  // 45s — safe for free CoinGecko tier
const ORDERBOOK_POLL_MS = 500;    // 500ms — sub-500ms latency requirement

class PriceEngine {
  constructor() {
    this._tickerTimer    = null;
    this._orderbookTimer = null;
    this._wss            = null;
    this._broadcast      = null;

    // Live price map: coingecko_id → asset (with micro drift applied)
    this._livePrices = new Map();

    // Per-client subscription sets (attached to ws object directly)
    // ws.subscriptions = Set<'orderbook:BTC-INR' | 'ticker'>
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async start(wss, broadcast) {
    this._wss       = wss;
    this._broadcast = broadcast;

    console.log('[engine] 🚀 Price engine starting...');

    // Initial fetch — populate cache immediately
    try {
      const assets = await marketService.fetchMarkets();
      this._updateLivePrices(assets);
      console.log(`[engine] ✅ Initial market data loaded (${assets.length} assets)`);
    } catch (err) {
      console.warn('[engine] Initial fetch failed — will retry on next poll:', err.message);
    }

    // Ticker poll loop
    this._tickerTimer = setInterval(() => this._tickerLoop(), PRICE_POLL_MS);

    // Order book broadcast loop
    this._orderbookTimer = setInterval(() => this._orderbookLoop(), ORDERBOOK_POLL_MS);

    // Wire up WS message handler for new connections
    this._wss.on('connection', (socket) => this._onClientConnect(socket));

    console.log(`[engine] ✅ Ticker every ${PRICE_POLL_MS / 1000}s | OrderBook every ${ORDERBOOK_POLL_MS}ms`);
  }

  stop() {
    clearInterval(this._tickerTimer);
    clearInterval(this._orderbookTimer);
    this._tickerTimer    = null;
    this._orderbookTimer = null;
    console.log('[engine] Price engine stopped.');
  }

  /** Get the latest live price for a single asset by CoinGecko ID */
  getPrice(id) { return this._livePrices.get(id) || null; }

  /** Get all live prices as an array */
  getAllPrices() { return Array.from(this._livePrices.values()); }

  // ── WebSocket Client Management ────────────────────────────────────────────

  _onClientConnect(socket) {
    // Default subscriptions: all clients receive ticker + top-5 order books
    socket.subscriptions = new Set(['ticker', ...ORDERBOOK_PAIRS.map(id => `orderbook:${id}`)]);

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this._handleClientMessage(socket, msg);
      } catch {
        this._send(socket, { type: 'ERROR', message: 'Invalid JSON message.' });
      }
    });

    // Send current snapshot immediately on connect
    const snapshot = this.getAllPrices();
    if (snapshot.length > 0) {
      this._send(socket, { type: 'TICKER_BATCH', data: snapshot, timestamp: Date.now() });
    }
  }

  _handleClientMessage(socket, msg) {
    switch (msg.type) {
      case 'SUBSCRIBE':
        if (Array.isArray(msg.channels)) {
          msg.channels.forEach(ch => socket.subscriptions?.add(ch));
        }
        this._send(socket, { type: 'ACK', action: 'SUBSCRIBE', channels: msg.channels });
        break;

      case 'UNSUBSCRIBE':
        if (Array.isArray(msg.channels)) {
          msg.channels.forEach(ch => socket.subscriptions?.delete(ch));
        }
        this._send(socket, { type: 'ACK', action: 'UNSUBSCRIBE', channels: msg.channels });
        break;

      case 'PING':
        this._send(socket, { type: 'PONG', timestamp: Date.now() });
        break;

      default:
        if (env.IS_DEV) console.log('[engine] Unknown message type:', msg.type);
    }
  }

  // ── Ticker Loop ────────────────────────────────────────────────────────────

  async _tickerLoop() {
    try {
      const assets = await marketService.fetchMarkets();
      this._updateLivePrices(assets);

      // Broadcast to all subscribed clients
      const payload = { type: 'TICKER_BATCH', data: assets, timestamp: Date.now() };
      this._broadcastToSubscribers('ticker', payload);

      if (env.IS_DEV) console.log(`[engine] 📡 TICKER_BATCH broadcast (${assets.length} assets)`);
    } catch (err) {
      console.warn('[engine] Ticker loop error:', err.message);
    }
  }

  // ── Order Book Loop ────────────────────────────────────────────────────────

  _orderbookLoop() {
    if (!this._wss || this._wss.clients.size === 0) return;

    for (const assetId of ORDERBOOK_PAIRS) {
      const live = this._livePrices.get(assetId);
      if (!live) continue;

      const channel = `orderbook:${assetId}`;
      const hasSubscribers = this._anyClientSubscribed(channel);
      if (!hasSubscribers) continue;

      // Apply micro-drift to price since last real API fetch
      const driftedPrice = applyMicroDrift(live.priceInr);
      const orderBook = generateOrderBook(live.pair, driftedPrice, live.volumeInr);

      const payload = { type: 'ORDERBOOK', data: orderBook };
      this._broadcastToSubscribers(channel, payload);
    }
  }

  // ── Internal Helpers ───────────────────────────────────────────────────────

  _updateLivePrices(assets) {
    for (const asset of assets) {
      this._livePrices.set(asset.id, asset);
    }
  }

  _send(socket, data) {
    if (socket.readyState === 1 /* OPEN */) {
      socket.send(JSON.stringify(data));
    }
  }

  _broadcastToSubscribers(channel, payload) {
    const message = JSON.stringify(payload);
    this._wss.clients.forEach((socket) => {
      if (socket.readyState === 1 && socket.subscriptions?.has(channel)) {
        socket.send(message);
      }
    });
  }

  _anyClientSubscribed(channel) {
    for (const socket of this._wss.clients) {
      if (socket.subscriptions?.has(channel)) return true;
    }
    return false;
  }
}

// Singleton
const priceEngine = new PriceEngine();
module.exports = priceEngine;
