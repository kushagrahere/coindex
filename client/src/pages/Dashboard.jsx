import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMarketStore } from '../store/marketStore';
import Navbar from '../components/Navbar';
import TickerTape from '../components/TickerTape';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const WalletCard = ({ wallet }) => (
  <div className="glass rounded-xl p-4 flex items-center justify-between card-hover"
       style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
    <div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-[#475569]">{wallet.asset}</div>
      <div className="text-[18px] font-mono font-bold text-[#f1f5f9]">
        {wallet.asset === 'INR' ? `₹${fmt(wallet.balance)}` : wallet.balance.toFixed(6)}
      </div>
    </div>
    {wallet.locked > 0 && (
      <div className="text-right">
        <div className="text-[10px] text-[#475569]">Locked</div>
        <div className="text-[13px] font-mono text-[#94a3b8]">{wallet.locked}</div>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user, wallets, isAuthenticated, fetchMe } = useAuthStore();
  const assets = useMarketStore(s => s.assets);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    fetchMe();
  }, [isAuthenticated, navigate, fetchMe]);

  if (!user) return (
    <div className="min-h-screen bg-[#04040d] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-violet-DEFAULT border-t-transparent animate-spin" />
    </div>
  );

  const inrWallet = wallets.find(w => w.asset === 'INR');
  const cryptoWallets = wallets.filter(w => w.asset !== 'INR');

  return (
    <div className="grain min-h-screen bg-[#04040d]">
      <Navbar />

      <div className="pt-24 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="neon-dot" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#10b981]">
              Paper Trading Mode
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-[#f1f5f9]">
            Welcome, <span className="text-gradient">{user.username}</span>
          </h1>
          <p className="text-[#475569] font-body mt-1">
            Your trading dashboard · Phase 4 chart & order book incoming
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Wallets */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#94a3b8] uppercase tracking-widest text-[12px] mb-4">
              Portfolio
            </h2>

            {/* INR balance hero */}
            {inrWallet && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-bright rounded-2xl p-6 shadow-glass"
                style={{ border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#475569] mb-1">
                  Available Balance
                </div>
                <div className="font-display text-4xl font-extrabold text-[#f1f5f9] mb-1">
                  ₹{fmt(inrWallet.balance)}
                </div>
                <div className="text-[12px] text-[#475569] font-mono">Indian Rupee · Paper</div>
                <div
                  className="mt-4 h-1 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
                />
              </motion.div>
            )}

            {/* Crypto wallets */}
            <div className="space-y-2">
              {cryptoWallets.map((w, i) => {
                const asset = assets.find(a => a.symbol === w.asset);
                return (
                  <motion.div
                    key={w.asset}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 * i }}
                  >
                    <WalletCard wallet={w} />
                    {asset && (
                      <div className="text-[11px] font-mono text-[#475569] px-1 mt-0.5">
                        ≈ ₹{fmt(w.balance * asset.priceInr)} · {asset.symbol}/INR ₹{fmt(asset.priceInr)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Phase 4 placeholder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chart placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 flex flex-col items-center justify-center shadow-glass"
              style={{ border: '1px solid rgba(255,255,255,0.07)', minHeight: 400 }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M4 24L12 14L18 18L26 8" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 8H26V12" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-[#f1f5f9] mb-2">TradingView Chart</h3>
              <p className="text-[#475569] text-[13px] text-center max-w-xs">
                Live candlestick charts with multi-timeframe toggles (1H · 1D · 1W) landing in Phase 4.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[12px] font-mono text-[#475569]">
                <div className="neon-dot" />
                OHLCV data ready · {assets.length} pairs primed
              </div>
            </motion.div>

            {/* Market snapshot */}
            <div className="grid grid-cols-2 gap-4">
              {assets.slice(0, 4).map((asset, i) => {
                const up = asset.change24h >= 0;
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="glass rounded-xl p-4 card-hover"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {asset.image && <img src={asset.image} className="w-6 h-6 rounded-full" alt={asset.symbol} />}
                      <span className="text-[12px] font-semibold text-[#94a3b8]">{asset.symbol}/INR</span>
                    </div>
                    <div className="font-mono font-bold text-[15px] text-[#f1f5f9]">
                      ₹{fmt(asset.priceInr)}
                    </div>
                    <div className={`text-[12px] font-mono mt-0.5 ${up ? 'price-up' : 'price-down'}`}>
                      {up ? '▲' : '▼'} {Math.abs(asset.change24h).toFixed(2)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <TickerTape />
    </div>
  );
}
