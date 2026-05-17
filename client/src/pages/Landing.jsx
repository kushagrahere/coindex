import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CosmicCanvas from '../components/CosmicCanvas';
import Navbar from '../components/Navbar';
import TickerTape from '../components/TickerTape';
import MarketOverviewCard from '../components/MarketOverviewCard';
import AuthModal from '../components/AuthModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } },
  item: {
    hidden:  { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  },
};

const BtcStatBadge = () => {
  const btc = useMarketStore(s => s.assets.find(a => a.id === 'bitcoin'));
  if (!btc) return null;
  const up = btc.change24h >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="inline-flex items-center gap-3 glass rounded-2xl px-5 py-3 shadow-glass animate-float"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <img src={btc.image} alt="BTC" className="w-7 h-7 rounded-full" />
      <div>
        <div className="text-[11px] text-[#475569] font-mono uppercase tracking-wider">BTC/INR</div>
        <div className="text-[15px] font-mono font-bold text-[#f1f5f9]">
          ₹{new Intl.NumberFormat('en-IN').format(Math.round(btc.priceInr))}
        </div>
      </div>
      <span className={`text-[12px] font-mono font-semibold px-2 py-1 rounded-lg ${
        up ? 'price-up bg-up/10' : 'price-down bg-down/10'
      }`}>
        {up ? '+' : ''}{btc.change24h?.toFixed(2)}%
      </span>
    </motion.div>
  );
};

const StatPill = ({ label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center gap-1"
  >
    <span className="text-[11px] font-mono uppercase tracking-widest text-[#475569]">{label}</span>
    <span className="text-[15px] font-display font-bold text-gradient">{value}</span>
  </motion.div>
);

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();

  // Start WebSocket — feeds the whole app
  useWebSocket();

  const assets = useMarketStore(s => s.assets);

  const openAuth = useCallback((mode = 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  }, []);

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-[#04040d]">
      {/* ── Three.js Background ────────────────────────────────────── */}
      <CosmicCanvas />

      {/* ── Radial gradient vignette ────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(4,4,13,0.7) 100%)',
        }}
      />

      {/* ── Left edge gradient (text readability) ────────────────────── */}
      <div
        className="fixed inset-y-0 left-0 w-[55%] z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(4,4,13,0.85) 0%, transparent 100%)' }}
      />

      {/* ── Content Layer ──────────────────────────────────────────── */}
      <div className="relative z-10">
        <Navbar />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <main className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-20">
          <div className="max-w-[700px]">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-2.5 mb-8"
            >
              <div className="neon-dot" />
              <span className="text-[12px] font-mono uppercase tracking-[0.2em] text-[#10b981]">
                Live Market · {assets.length} Assets · INR
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <motion.h1
                variants={stagger.item}
                className="font-display font-extrabold leading-[0.95] tracking-tight text-[#f1f5f9] mb-2"
                style={{ fontSize: 'clamp(52px, 7vw, 96px)' }}
              >
                TRADE
              </motion.h1>
              <motion.h1
                variants={stagger.item}
                className="font-display font-extrabold leading-[0.95] tracking-tight text-gradient mb-2"
                style={{ fontSize: 'clamp(52px, 7vw, 96px)' }}
              >
                CRYPTO
              </motion.h1>
              <motion.h1
                variants={stagger.item}
                className="font-display font-extrabold leading-[0.95] tracking-tight mb-2"
                style={{
                  fontSize: 'clamp(52px, 7vw, 96px)',
                  WebkitTextStroke: '1px rgba(255,255,255,0.25)',
                  color: 'transparent',
                }}
              >
                IN INDIA
              </motion.h1>
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-[#64748b] font-body leading-relaxed mb-4"
              style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', maxWidth: 480 }}
            >
              Real-time INR prices. Institutional-grade charts.
              Paper trading with ₹10,00,000 — zero risk.
            </motion.p>

            {/* BTC badge */}
            <div className="mb-10">
              <BtcStatBadge />
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button
                onClick={() => openAuth('register')}
                className="btn-glow px-8 py-4 rounded-xl font-display font-bold text-[15px] text-white"
              >
                <span>Enter Market →</span>
              </button>
              <button
                onClick={() => openAuth('login')}
                className="btn-outline px-7 py-4 rounded-xl font-display font-semibold text-[15px] text-[#94a3b8]"
              >
                Sign In
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="flex items-center gap-10 mt-14"
            >
              <StatPill label="Assets"     value={`${assets.length}+`} delay={1.1} />
              <div className="w-px h-8 bg-white/10" />
              <StatPill label="Currency"   value="INR"          delay={1.2} />
              <div className="w-px h-8 bg-white/10" />
              <StatPill label="Latency"    value="<500ms"       delay={1.3} />
              <div className="w-px h-8 bg-white/10" />
              <StatPill label="Paper ₹"   value="₹10L"         delay={1.4} />
            </motion.div>
          </div>

          {/* Market Overview Card — floating right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2"
            style={{ zIndex: 20 }}
          >
            <MarketOverviewCard />
          </motion.div>
        </main>
      </div>

      {/* ── Ticker Tape ────────────────────────────────────────────── */}
      <TickerTape />

      {/* ── Auth Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            mode={authMode}
            onModeChange={setAuthMode}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
