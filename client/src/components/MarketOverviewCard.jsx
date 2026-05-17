import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../store/marketStore';

const fmt = (n) =>
  n >= 1000
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(n);

const fmtCr = (n) => {
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5)  return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${fmt(n)}`;
};

const AssetRow = memo(({ asset, delay }) => {
  const up = asset.change24h >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between py-3 px-4 rounded-xl card-hover glass cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {asset.image && (
          <img src={asset.image} alt={asset.symbol} className="w-8 h-8 rounded-full" loading="lazy" />
        )}
        <div>
          <div className="text-[13px] font-semibold text-[#f1f5f9]">{asset.symbol}</div>
          <div className="text-[11px] text-[#475569] leading-none">{asset.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-mono font-semibold text-[#f1f5f9]">₹{fmt(asset.priceInr)}</div>
        <div className={`text-[11px] font-mono ${up ? 'price-up' : 'price-down'}`}>
          {up ? '▲' : '▼'} {Math.abs(asset.change24h).toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
});

export default function MarketOverviewCard() {
  const assets = useMarketStore(s => s.assets);

  const top5 = useMemo(
    () => [...assets].sort((a, b) => a.rank - b.rank).slice(0, 5),
    [assets]
  );

  const totalVolume = useMemo(
    () => assets.reduce((sum, a) => sum + (a.volumeInr || 0), 0),
    [assets]
  );

  const gainers = assets.filter(a => a.change24h > 0).length;

  if (top5.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-5 shadow-glass"
      style={{ border: '1px solid rgba(255,255,255,0.07)', minWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#475569]">
          Live Markets
        </span>
        <div className="flex gap-3 text-[11px] font-mono">
          <span className="price-up">↑ {gainers} gaining</span>
          <span className="price-down">↓ {assets.length - gainers} losing</span>
        </div>
      </div>

      {/* Asset list */}
      <div className="flex flex-col gap-1.5">
        {top5.map((asset, i) => (
          <AssetRow key={asset.id} asset={asset} delay={0.1 * i} />
        ))}
      </div>

      {/* Footer */}
      <div className="divider my-3" />
      <div className="flex justify-between text-[11px] font-mono text-[#475569]">
        <span>24h Volume</span>
        <span className="text-[#94a3b8]">{fmtCr(totalVolume)}</span>
      </div>
    </motion.div>
  );
}
