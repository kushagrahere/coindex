'use strict';

/**
 * Migration 001 — Initial Schema
 * Tables: users, wallets, trades, sessions, price_cache
 * Currency: INR as base fiat
 *
 * Run:  node src/migrations/001_initial.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { getDb } = require('../config/db');

const runMigration = async () => {
  const db = await getDb();

  const migrate = db.transaction(() => {
    // ── Users ───────────────────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        email         TEXT    UNIQUE NOT NULL,
        username      TEXT    UNIQUE NOT NULL,
        password_hash TEXT    NOT NULL,
        role          TEXT    NOT NULL DEFAULT 'user',
        is_active     INTEGER NOT NULL DEFAULT 1,
        created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at    DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // ── Wallets ─────────────────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        asset      TEXT    NOT NULL,
        balance    REAL    NOT NULL DEFAULT 0,
        locked     REAL    NOT NULL DEFAULT 0,
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // ── Trades ──────────────────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      INTEGER NOT NULL REFERENCES users(id),
        symbol       TEXT    NOT NULL,
        side         TEXT    NOT NULL,
        order_type   TEXT    NOT NULL,
        price_inr    REAL    NOT NULL,
        quantity     REAL    NOT NULL,
        total_inr    REAL    NOT NULL,
        fee_inr      REAL    NOT NULL DEFAULT 0,
        status       TEXT    NOT NULL DEFAULT 'OPEN',
        coingecko_id TEXT,
        created_at   DATETIME NOT NULL DEFAULT (datetime('now')),
        filled_at    DATETIME
      )
    `);

    // ── Sessions ─────────────────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT    PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        expires_at DATETIME NOT NULL,
        revoked    INTEGER NOT NULL DEFAULT 0,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // ── Price Cache (Phase 2 prep) ───────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS price_cache (
        coingecko_id TEXT    PRIMARY KEY,
        symbol       TEXT    NOT NULL,
        name         TEXT    NOT NULL,
        price_inr    REAL    NOT NULL,
        change_24h   REAL    DEFAULT 0,
        market_cap   REAL    DEFAULT 0,
        volume_24h   REAL    DEFAULT 0,
        image_url    TEXT,
        fetched_at   DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `);
  });

  migrate();
  console.log('[migrate] ✅ Migration 001_initial complete — all tables created.');
  db._flush();
};

// Run standalone
if (require.main === module) {
  runMigration().catch((err) => {
    console.error('[migrate] ❌ Migration failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runMigration };
