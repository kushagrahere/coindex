import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../store/marketStore';

const fmt = (n) =>
  n >= 1000
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(n);

const TickerItem = ({ asset }) => {
  const up = asset.change24h >= 0;
  return (
    <span className="inline-flex items-center gap-2 mx-6 shrink-0">
      <span className="text-[11px] font-mono font-semibold tracking-wider text-[#94a3b8]">
        {asset.symbol}
      </span>
      <span className="text-[12px] font-mono font-semibold text-[#f1f5f9]">
        ₹{fmt(asset.priceInr)}
      </span>
      <span className={`text-[11px] font-mono font-medium ${up ? 'price-up' : 'price-down'}`}>
        {up ? '+' : ''}{asset.change24h?.toFixed(2)}%
      </span>
      <span className="text-[#1e1e3a] select-none">|</span>
    </span>
  );
};

export default function TickerTape() {
  const assets = useMarketStore(s => s.assets);

  const items = useMemo(
    () => assets.length > 0 ? assets : [],
    [assets]
  );

  if (items.length === 0) return null;

  // Duplicate for seamless infinite loop
  const doubled = [...items, ...items];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06]"
         style={{ background: 'rgba(4,4,13,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="ticker-wrap py-2.5">
        <div className="ticker-track">
          {doubled.map((asset, i) => (
            <TickerItem key={`${asset.id}-${i}`} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
