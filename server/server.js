'use strict';

require('dotenv').config();

const http = require('http');
const { WebSocketServer } = require('ws');
const createApp = require('./src/app');
const { getDb } = require('./src/config/db');
const { runMigration } = require('./src/migrations/001_initial');
const priceEngine = require('./src/engine/priceEngine');
const env = require('./src/config/env');

const start = async () => {
  // ── 1. Database ─────────────────────────────────────────────────────────────
  console.log('[server] Initializing database...');
  await getDb();
  await runMigration();

  // ── 2. Express + HTTP ────────────────────────────────────────────────────────
  const app    = createApp();
  const server = http.createServer(app);

  // ── 3. WebSocket Server ──────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Heartbeat — prune zombie connections every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (!socket.isAlive) return socket.terminate();
      socket.isAlive = false;
      socket.ping();
    });
  }, 30_000);

  wss.on('connection', (socket, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[ws] Client connected: ${clientIp} (total: ${wss.clients.size})`);

    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('close', () => {
      console.log(`[ws] Client disconnected: ${clientIp} (remaining: ${wss.clients.size - 1})`);
    });

    // Welcome frame
    socket.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Coindex Market Feed v2 online.',
      assets: 50,
      currency: 'INR',
      updateIntervalMs: 45000,
      orderbookIntervalMs: 500,
      timestamp: Date.now(),
    }));
  });

  wss.on('close', () => clearInterval(heartbeat));

  // Broadcast helper — used by price engine
  const broadcast = (data) => {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(payload);
    });
  };

  app.locals.broadcast = broadcast;
  app.locals.wss       = wss;

  // ── 4. Start Price Engine ────────────────────────────────────────────────────
  await priceEngine.start(wss, broadcast);

  // ── 5. Listen ────────────────────────────────────────────────────────────────
  server.listen(env.PORT, () => {
    console.log('');
    console.log('  ╔════════════════════════════════════════╗');
    console.log('  ║   COINDEX API  —  v2.0.0               ║');
    console.log(`  ║   HTTP  → http://localhost:${env.PORT}        ║`);
    console.log(`  ║   WS    → ws://localhost:${env.PORT}/ws     ║`);
    console.log(`  ║   ENV   → ${env.NODE_ENV.padEnd(29)} ║`);
    console.log('  ╚════════════════════════════════════════╝');
    console.log('');
  });

  return { server, wss, broadcast };
};

start().catch((err) => {
  console.error('[server] ❌ Fatal startup error:', err);
  process.exit(1);
});
