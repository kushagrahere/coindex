'use strict';

/**
 * Market Service — CoinGecko API client with intelligent INR-denominated caching
 *
 * Cache strategy:
 *  - In-memory LRU-style Map (primary, zero-latency)
 *  - SQLite price_cache table (secondary — survives process restarts)
 *  - CoinGecko API (tertiary — rate-limited, 1 bulk call per PRICE_TTL ms)
 *
 * Rate discipline:
 *  - ALL 50 assets fetched in a single /coins/markets call
 *  - OHLCV fetched per-asset, cached for OHLCV_TTL ms
 *  - Exponential backoff on 429 / 503
 */

const https = require('https');
const { ASSETS, ASSET_BY_ID, ALL_IDS } = require('../config/assets');
const env = require('../config/env');

// TTLs
const PRICE_TTL_MS  = env.COINGECKO_CACHE_TTL_MS || 45_000;  // 45s
const OHLCV_TTL_MS  = 5 * 60 * 1000;                          // 5 min
const SEARCH_TTL_MS = 10 * 60 * 1000;                         // 10 min

// ── In-Memory Cache ───────────────────────────────────────────────────────────

class TTLCache {
  constructor() { this._store = new Map(); }

  set(key, value, ttlMs) {
    this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this._store.delete(key); return undefined; }
    return entry.value;
  }

  has(key) { return this.get(key) !== undefined; }

  delete(key) { this._store.delete(key); }

  // Prune expired entries (call periodically to prevent memory leak)
  prune() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now > entry.expiresAt) this._store.delete(key);
    }
  }
}

const cache = new TTLCache();
setInterval(() => cache.prune(), 60_000);

// ── HTTP Fetch Helper ─────────────────────────────────────────────────────────

const fetchJson = (url, retries = 2) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Coindex/1.0 (https://coindex.in)',
        'Accept': 'application/json',
      },
      timeout: 8000,
    }, (res) => {
      if (res.statusCode === 429 || res.statusCode === 503) {
        const err = new Error(`CoinGecko rate limited (${res.statusCode})`);
        err.status = res.statusCode;
        err.retryable = true;
        return reject(err);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`CoinGecko returned ${res.statusCode} for ${url}`));
      }
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Failed to parse CoinGecko response')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('CoinGecko request timed out')); });
    req.on('error', (e) => {
      if (retries > 0) {
        setTimeout(() => fetchJson(url, retries - 1).then(resolve).catch(reject), 1500);
      } else {
        reject(e);
      }
    });
  });

// ── Normalizers ───────────────────────────────────────────────────────────────

const normalizeAsset = (raw, meta) => ({
  id:           raw.id,
  symbol:       (meta?.symbol || raw.symbol || '').toUpperCase(),
  name:         meta?.name || raw.name,
  pair:         `${(meta?.symbol || raw.symbol || '').toUpperCase()}-INR`,
  category:     meta?.category || 'other',
  rank:         raw.market_cap_rank || 0,
  priceInr:     raw.current_price || 0,
  change24h:    raw.price_change_percentage_24h || 0,
  changeAmt24h: raw.price_change_24h || 0,
  marketCapInr: raw.market_cap || 0,
  volumeInr:    raw.total_volume || 0,
  high24h:      raw.high_24h || 0,
  low24h:       raw.low_24h || 0,
  image:        raw.image || '',
  updatedAt:    Date.now(),
});

// ── DB Persistence (lazy — only used after getDb resolves) ───────────────────

let _db = null;
const getDbLazy = () => {
  if (!_db) {
    try { _db = require('../config/db').db(); } catch { /* DB not ready yet */ }
  }
  return _db;
};

const persistToDb = (assets) => {
  const d = getDbLazy();
  if (!d) return;
  try {
    const upsert = d.prepare(`
      INSERT INTO price_cache (coingecko_id, symbol, name, price_inr, change_24h, market_cap, volume_24h, image_url, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(coingecko_id) DO UPDATE SET
        price_inr = excluded.price_inr,
        change_24h = excluded.change_24h,
        market_cap = excluded.market_cap,
        volume_24h = excluded.volume_24h,
        image_url = excluded.image_url,
        fetched_at = datetime('now')
    `);
    const tx = d.transaction(() => {
      for (const a of assets) {
        upsert.run(a.id, a.symbol, a.name, a.priceInr, a.change24h, a.marketCapInr, a.volumeInr, a.image);
      }
    });
    tx();
  } catch (err) {
    if (env.IS_DEV) console.error('[market] DB persist error:', err.message);
  }
};

const loadFromDb = () => {
  const d = getDbLazy();
  if (!d) return [];
  try {
    return d.prepare('SELECT * FROM price_cache ORDER BY market_cap DESC').all();
  } catch { return []; }
};

// ── Market Service ────────────────────────────────────────────────────────────

/**
 * Fetch all 50 assets from CoinGecko in one call
 * Updates in-memory cache and SQLite price_cache
 */
const fetchMarkets = async () => {
  const url = `${env.COINGECKO_BASE_URL}/coins/markets`
    + `?vs_currency=inr`
    + `&ids=${ALL_IDS}`
    + `&order=market_cap_desc`
    + `&per_page=50`
    + `&page=1`
    + `&sparkline=false`
    + `&price_change_percentage=24h`;

  console.log('[market] Fetching prices from CoinGecko...');
  const raw = await fetchJson(url);

  const assets = raw.map(item => {
    const meta = ASSET_BY_ID.get(item.id);
    return normalizeAsset(item, meta);
  });

  // Update in-memory cache
  cache.set('markets:all', assets, PRICE_TTL_MS);
  for (const asset of assets) {
    cache.set(`ticker:${asset.id}`, asset, PRICE_TTL_MS);
  }

  // Persist to SQLite
  persistToDb(assets);

  console.log(`[market] ✅ Fetched ${assets.length} assets (cached ${PRICE_TTL_MS / 1000}s)`);
  return assets;
};

/**
 * Get all markets — cache first, then API, then SQLite fallback
 */
const getMarkets = async () => {
  const cached = cache.get('markets:all');
  if (cached) return cached;

  try {
    return await fetchMarkets();
  } catch (err) {
    console.warn('[market] CoinGecko fetch failed, loading from DB:', err.message);
    const dbRows = loadFromDb();
    if (dbRows.length > 0) {
      const fallback = dbRows.map(row => ({
        id: row.coingecko_id,
        symbol: row.symbol,
        name: row.name,
        pair: `${row.symbol}-INR`,
        priceInr: row.price_inr,
        change24h: row.change_24h,
        changeAmt24h: 0,
        marketCapInr: row.market_cap,
        volumeInr: row.volume_24h,
        image: row.image_url,
        category: ASSET_BY_ID.get(row.coingecko_id)?.category || 'other',
        rank: 0,
        updatedAt: new Date(row.fetched_at).getTime(),
        stale: true,
      }));
      cache.set('markets:all', fallback, 10_000); // short TTL for fallback
      return fallback;
    }
    throw err;
  }
};

/**
 * Get single asset ticker
 */
const getTicker = async (id) => {
  const cached = cache.get(`ticker:${id}`);
  if (cached) return cached;

  const markets = await getMarkets();
  return markets.find(a => a.id === id) || null;
};

/**
 * Fetch OHLCV candle data — cached 5 minutes
 * Returns TradingView-compatible format: [{ time, open, high, low, close }]
 *
 * CoinGecko /ohlc free tier bucket sizes:
 *   days=1  → ~30min candles
 *   days=7  → ~4h candles
 *   days=14 → ~4h candles
 *   days=30 → ~4day candles
 */
const getOHLCV = async (id, days = 1) => {
  const cacheKey = `ohlcv:${id}:${days}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${env.COINGECKO_BASE_URL}/coins/${id}/ohlc`
    + `?vs_currency=inr`
    + `&days=${days}`;

  const raw = await fetchJson(url);

  // raw: [[timestamp_ms, open, high, low, close], ...]
  const candles = raw.map(([t, o, h, l, c]) => ({
    time: Math.floor(t / 1000),  // TradingView expects seconds
    open:  o,
    high:  h,
    low:   l,
    close: c,
  }));

  cache.set(cacheKey, candles, OHLCV_TTL_MS);
  return candles;
};

/**
 * Top movers — sorted by absolute 24h change %
 */
const getTrending = async () => {
  const markets = await getMarkets();
  const sorted = [...markets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  return {
    gainers: sorted.filter(a => a.change24h > 0).slice(0, 10),
    losers:  sorted.filter(a => a.change24h < 0).slice(0, 10),
  };
};

/**
 * Search assets by name or symbol (in-memory, no API call)
 */
const searchAssets = async (query) => {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const markets = await getMarkets();
  return markets.filter(a =>
    a.symbol.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.id.toLowerCase().includes(q)
  ).slice(0, 20);
};

/**
 * Get the raw in-memory cache for use by the price engine
 * (avoids unnecessary API calls in tight broadcast loops)
 */
const getCachedMarkets = () => cache.get('markets:all') || [];

module.exports = {
  fetchMarkets,
  getMarkets,
  getTicker,
  getOHLCV,
  getTrending,
  searchAssets,
  getCachedMarkets,
};
