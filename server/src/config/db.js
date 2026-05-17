'use strict';

/**
 * db.js — sql.js (pure WebAssembly SQLite) wrapper
 *
 * sql.js runs entirely in JS/WASM — zero native compilation required on Windows.
 * We maintain a synchronous-style API similar to better-sqlite3 by exposing
 * prepare(), exec(), and transaction() helpers backed by the in-memory DB.
 * The DB is persisted to disk on every write and loaded at startup.
 */

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const env = require('./env');

const DB_PATH = path.resolve(__dirname, '../../', env.DB_PATH);
const DB_DIR  = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ── Synchronous DB wrapper ─────────────────────────────────────────────────────
class SyncDB {
  constructor(sqlJs) {
    const fileBuffer = fs.existsSync(DB_PATH)
      ? fs.readFileSync(DB_PATH)
      : null;
    this._db = fileBuffer
      ? new sqlJs.Database(fileBuffer)
      : new sqlJs.Database();
    this._dirty = false;

    // Enable FK constraints
    this.exec('PRAGMA foreign_keys = ON;');

    // Auto-flush every 5 seconds
    this._flushInterval = setInterval(() => this._flush(), 5000);
  }

  // Persist in-memory DB to disk
  _flush() {
    if (!this._dirty) return;
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    this._dirty = false;
    if (env.IS_DEV) process.stdout.write('[sqlite] flushed to disk\n');
  }

  exec(sql) {
    this._db.run(sql);
    this._dirty = true;
  }

  // Returns a prepared-statement-like object
  prepare(sql) {
    return new SyncStatement(this, sql);
  }

  // Transaction wrapper — runs fn(), then flushes
  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN');
      try {
        const result = fn(...args);
        this._db.run('COMMIT');
        this._dirty = true;
        this._flush();
        return result;
      } catch (err) {
        this._db.run('ROLLBACK');
        throw err;
      }
    };
  }

  close() {
    clearInterval(this._flushInterval);
    this._flush();
    this._db.close();
  }
}

class SyncStatement {
  constructor(syncDb, sql) {
    this._syncDb = syncDb;
    this._sql = sql;
  }

  // Execute a DML (INSERT/UPDATE/DELETE) — returns { lastInsertRowid, changes }
  run(...params) {
    this._syncDb._db.run(this._sql, this._normalize(params));
    const [{ lastInsertRowid, changes }] = this._syncDb._db.exec(
      'SELECT last_insert_rowid() as id, changes() as changes'
    ).flatMap(r => r.values.map(v => ({ lastInsertRowid: v[0], changes: v[1] })));
    this._syncDb._dirty = true;
    return { lastInsertRowid, changes };
  }

  // Execute a SELECT — returns first row as object or undefined
  get(...params) {
    const stmt = this._syncDb._db.prepare(this._sql);
    stmt.bind(this._normalize(params));
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  }

  // Execute a SELECT — returns all rows as array of objects
  all(...params) {
    const stmt = this._syncDb._db.prepare(this._sql);
    stmt.bind(this._normalize(params));
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // Normalize params: accept (a, b, c) or ([a, b, c]) or no args
  _normalize(params) {
    if (params.length === 0) return [];
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  }
}

// ── Singleton initialization ──────────────────────────────────────────────────
let _db = null;

const getDb = async () => {
  if (_db) return _db;
  const SQL = await initSqlJs();
  _db = new SyncDB(SQL);
  process.on('exit', () => _db.close());
  process.on('SIGINT', () => { _db.close(); process.exit(0); });
  process.on('SIGTERM', () => { _db.close(); process.exit(0); });
  return _db;
};

// Synchronous getter — only works after initDb() has resolved
const db = () => {
  if (!_db) throw new Error('[db] Database not initialized. Await initDb() first.');
  return _db;
};

module.exports = { getDb, db };
