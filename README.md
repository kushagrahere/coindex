<div align="center">
  <img src="client/public/favicon.svg" width="64" height="64" alt="Coindex Logo" />
  <h1>Coindex</h1>
  <p><strong>Production-grade cryptocurrency trading platform — built for India, priced in INR.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" />
    <img src="https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
    <img src="https://img.shields.io/badge/SQLite-sql.js-003B57?style=flat-square&logo=sqlite" />
    <img src="https://img.shields.io/badge/WebSocket-Live-10b981?style=flat-square" />
    <img src="https://img.shields.io/badge/Currency-INR-f59e0b?style=flat-square" />
  </p>

  <img src="https://raw.githubusercontent.com/yourusername/coindexv2/main/docs/preview.png" alt="Coindex Landing Page" width="100%" />
</div>

---

## ✨ Overview

Coindex is a full-stack, real-time cryptocurrency trading platform designed from the ground up for the Indian market. Every price, balance, P&L figure, and volume metric is denominated in **Indian Rupees (₹)**.

The frontend draws visual inspiration from [threejs.paris](https://threejs.paris), [Utopia](https://utopia.fyi), [La Space](https://la.space), and [Sutera](https://sutera.com) — creating an experience that feels less like a traditional exchange dashboard and more like an **immersive, high-end digital environment**.

The backend is architected after the modular, microservice-ready patterns of top Indian exchanges like **CoinDCX** and **CoinSwitch** — built to handle high-throughput real-time data without breaking.

---

## 🚀 Features

### Backend (Node.js + Express)
- **Modular API** — Clean route separation: `/api/v1/auth`, `/api/v1/market`, `/api/v1/trade`
- **JWT Authentication** — Stateless sessions with 15-min access tokens + 7-day rotating refresh tokens
- **3-Tier Market Cache** — In-memory TTL cache → SQLite fallback → CoinGecko API. ~80% reduction in external API calls
- **Real-Time WebSocket Feed** — 48 assets broadcast every 45s; simulated order book depth every 500ms
- **SQLite Persistence** — Pure WebAssembly `sql.js` (zero native compilation on Windows). Schema: `users`, `wallets`, `trades`, `sessions`, `price_cache`
- **Security Stack** — `helmet`, `cors`, tiered `express-rate-limit` (global / auth / market / trade), `bcryptjs` (cost 12)
- **Paper Trading** — New users receive ₹10,00,000 INR + seed crypto positions (BTC, ETH, SOL, BNB) automatically

### Frontend (React + Vite + Three.js)
- **Immersive 3D Scene** — Three.js particle star field (8,000 stars) + Fibonacci-distributed crypto orb (4,000 particles, violet→cyan→gold gradient) with mouse parallax
- **Live Ticker Tape** — 48 assets scrolling continuously with INR prices and 24h % change
- **Glassmorphism UI** — `backdrop-filter: blur(24px)` cards with layered transparency and neon glow accents
- **Fluid Typography** — `clamp()`-based display type scaling from 52px → 96px. "TRADE / CRYPTO / IN INDIA" hero with WebKit text-stroke outline effect
- **Film Grain Overlay** — Animated SVG noise texture at 3.2% opacity for that premium analog feel
- **Auth Flow** — Spring-animated modal (Framer Motion) with tab switching, animated field reveals, demo account autofill
- **WebSocket Hook** — Auto-reconnect with exponential backoff (1s → 30s), latency measurement, memoized Zustand selectors
- **State Management** — Zustand with primitive selectors (no unnecessary re-renders)

### Market Data
- **48 Assets** tracked across Layer 1, Layer 2, DeFi, Gaming, Meme, Privacy, and Exchange Token categories
- **INR pricing** via CoinGecko `/coins/markets?vs_currency=inr`
- **OHLCV candles** in TradingView-compatible `{time, open, high, low, close}` format — ready for Phase 4 chart wiring
- **Realistic Order Book** — Gaussian-noised 15-level bid/ask depth with 0.03–0.06% spread

---

## 🏗️ Architecture

```
coindexv2/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CosmicCanvas.jsx     # Three.js star field + particle orb
│   │   │   ├── Navbar.jsx           # Fixed nav with live WS indicator
│   │   │   ├── TickerTape.jsx       # Live INR price scroller
│   │   │   ├── AuthModal.jsx        # Glass auth modal (Framer Motion)
│   │   │   └── MarketOverviewCard.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Hero page (Three.js + live data)
│   │   │   └── Dashboard.jsx        # Portfolio + market snapshot
│   │   ├── hooks/
│   │   │   └── useWebSocket.js      # WS with exponential backoff reconnect
│   │   ├── store/
│   │   │   ├── authStore.js         # Zustand auth state
│   │   │   └── marketStore.js       # Zustand live market state
│   │   └── lib/
│   │       └── api.js               # JWT-aware fetch client
│   └── tailwind.config.js           # Cosmic design system tokens
│
└── server/                          # Node.js + Express backend
    ├── server.js                    # HTTP + WebSocket entry (async init)
    └── src/
        ├── config/
        │   ├── db.js                # sql.js WASM wrapper (SyncDB)
        │   └── env.js               # Validated env vars
        ├── engine/
        │   └── priceEngine.js       # Market orchestrator (fetch→cache→broadcast)
        ├── migrations/
        │   └── 001_initial.js       # Full schema (5 tables)
        ├── routes/
        │   ├── auth.routes.js       # register/login/logout/refresh/me
        │   ├── market.routes.js     # assets/ticker/ohlcv/trending/search
        │   └── trade.routes.js      # (Phase 4)
        ├── services/
        │   ├── auth.service.js      # JWT issuance, bcrypt, token rotation
        │   ├── market.service.js    # CoinGecko client + TTL cache
        │   └── orderbook.service.js # Gaussian order book simulator
        └── middleware/
            ├── auth.js              # Bearer JWT guard + RBAC
            ├── errorHandler.js      # Centralized error + asyncHandler
            └── rateLimiter.js       # Tiered rate limiting
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/coindexv2.git
cd coindexv2

# Install root (concurrently)
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Environment

The server ships with a working `.env` for local development. For production, update:

```bash
# server/.env
JWT_ACCESS_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=your_other_strong_secret_here
```

### 3. Seed the Database

```bash
npm run seed
```

This creates the demo account and pre-funds it:

| Field    | Value             |
|----------|-------------------|
| Email    | demo@coindex.in   |
| Password | Demo@1234         |
| INR      | ₹10,00,000        |
| Crypto   | BTC · ETH · SOL · BNB |

### 4. Run (Development)

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Or from the root (requires both to be installed):
```bash
npm run dev
```

Open **http://localhost:5173**

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account (auto-seeds ₹10L wallet) |
| POST | `/api/v1/auth/login` | Returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/me` | Current user + wallet balances |

### Market (all prices in INR)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/market/assets` | Paginated asset list (`?page=1&per_page=20&sort=rank`) |
| GET | `/api/v1/market/ticker/:id` | Single asset ticker |
| GET | `/api/v1/market/ohlcv/:id` | Candles (`?days=1\|7\|14\|30\|90\|365`) |
| GET | `/api/v1/market/trending` | Top gainers & losers |
| GET | `/api/v1/market/search?q=` | Search by name or symbol |
| GET | `/api/v1/market/orderbook/:id` | REST order book snapshot |
| GET | `/api/v1/market/categories` | Asset category list |

### WebSocket (`ws://localhost:3001/ws`)
```jsonc
// Subscribe
{ "type": "SUBSCRIBE",   "channels": ["ticker", "orderbook:bitcoin"] }
{ "type": "UNSUBSCRIBE", "channels": ["orderbook:ethereum"] }
{ "type": "PING" }

// Receive
{ "type": "CONNECTED",    "assets": 48, "currency": "INR" }
{ "type": "TICKER_BATCH", "data": [...48 assets...], "timestamp": 1234567890 }
{ "type": "ORDERBOOK",    "data": { "symbol": "BTC-INR", "bids": [...], "asks": [...] } }
{ "type": "PONG",         "timestamp": 1234567890 }
```

---

## 🗺️ Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Backend foundation — Express, SQLite, JWT auth, migrations, seed |
| Phase 2 | ✅ Complete | Market engine — CoinGecko cache, WebSocket price feed, order book simulator |
| Phase 3 | ✅ Complete | Immersive frontend — Three.js, Framer Motion, landing page, auth modal, dashboard scaffold |
| Phase 4 | 🔜 Next | TradingView Lightweight Charts, live order book UI, P&L dashboard, trade execution |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#04040d` | Page background |
| `--violet` | `#7c3aed` | Primary brand, buttons, active states |
| `--cyan` | `#06b6d4` | Accent, gradient endpoint, links |
| `--up` | `#10b981` | Price gains |
| `--down` | `#f43f5e` | Price losses |
| Font Display | Plus Jakarta Sans | Headings, hero |
| Font Body | Inter | Body text, UI |
| Font Mono | JetBrains Mono | Prices, code, labels |

---

## 🛡️ Security

- JWT access tokens expire in **15 minutes**; refresh tokens rotate on every use (single-use)
- Passwords hashed with **bcrypt** at cost factor 12
- Rate limiting: Auth (15 req/15min) · Market (60 req/min) · Trade (30 req/min)
- All HTTP responses include `helmet` security headers
- CORS restricted to configured client origin

---

## 📄 License

MIT © 2026 Coindex

---

<div align="center">
  <sub>Built with Three.js · React · Node.js · Framer Motion · CoinGecko · WebSockets</sub>
</div>
