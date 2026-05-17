'use strict';

/**
 * Demo Seed
 * email:    demo@coindex.in
 * password: Demo@1234
 * Balance:  ₹10,00,000 INR + BTC/ETH/SOL/BNB
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');
const { runMigration } = require('../migrations/001_initial');
const env = require('../config/env');

const DEMO_USER = {
  email: 'demo@coindex.in',
  username: 'demo_trader',
  password: 'Demo@1234',
};

const DEMO_CRYPTO_BALANCES = [
  { asset: 'BTC',  balance: 0.05 },
  { asset: 'ETH',  balance: 0.8  },
  { asset: 'SOL',  balance: 5    },
  { asset: 'BNB',  balance: 1    },
];

const runSeed = async () => {
  // Ensure tables exist
  await runMigration();

  const db = await getDb();

  const seedFn = db.transaction(() => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_USER.email);
    if (existing) {
      console.log('[seed] Demo user already exists — skipping.');
      return;
    }

    const passwordHash = bcrypt.hashSync(DEMO_USER.password, 12);

    const { lastInsertRowid: userId } = db.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    ).run(DEMO_USER.email, DEMO_USER.username, passwordHash);

    // INR base wallet
    db.prepare(
      "INSERT INTO wallets (user_id, asset, balance) VALUES (?, 'INR', ?)"
    ).run(userId, env.SEED_INR_BALANCE);

    // Crypto wallets
    const insertWallet = db.prepare(
      'INSERT INTO wallets (user_id, asset, balance) VALUES (?, ?, ?)'
    );
    for (const { asset, balance } of DEMO_CRYPTO_BALANCES) {
      insertWallet.run(userId, asset, balance);
    }

    console.log(`[seed] ✅ Demo user created (id=${userId})`);
    console.log(`[seed]    email:    ${DEMO_USER.email}`);
    console.log(`[seed]    password: ${DEMO_USER.password}`);
    console.log(`[seed]    INR:      ₹${env.SEED_INR_BALANCE.toLocaleString('en-IN')}`);
    console.log(`[seed]    Crypto:   ${DEMO_CRYPTO_BALANCES.map(w => w.asset).join(', ')}`);
  });

  seedFn();
  db._flush();
};

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('[seed] ❌ Seed failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runSeed };
