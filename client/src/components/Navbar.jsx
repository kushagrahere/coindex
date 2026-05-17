import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import AuthModal from './AuthModal';

const Logo = () => (
  <a href="/" className="flex items-center gap-2.5 group">
    <div className="relative">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="8" cy="8" r="2.5" fill="white"/>
        </svg>
      </div>
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"
           style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', filter: 'blur(8px)' }} />
    </div>
    <span className="font-display font-bold text-lg tracking-tight">
      Coin<span className="text-gradient">dex</span>
    </span>
  </a>
);

const WsIndicator = () => {
  const wsConnected = useMarketStore(s => s.wsConnected);
  const wsLatency   = useMarketStore(s => s.wsLatency);
  return (
    <div className="hidden md:flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-up' : 'bg-down'}`}
           style={wsConnected ? { boxShadow: '0 0 6px #10b981, 0 0 12px rgba(16,185,129,0.4)' } : {}} />
      <span className="text-[11px] font-mono text-[#475569]">
        {wsConnected ? `Live${wsLatency ? ` · ${wsLatency}ms` : ''}` : 'Connecting...'}
      </span>
    </div>
  );
};

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openLogin    = () => { setAuthMode('login');    setShowAuth(true); };
  const openRegister = () => { setAuthMode('register'); setShowAuth(true); };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: 'rgba(4,4,13,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Logo />

        <div className="flex items-center gap-3">
          <WsIndicator />

          <button
            onClick={openLogin}
            className="btn-outline text-[13px] font-medium text-[#94a3b8] px-4 py-2 rounded-lg"
          >
            Sign In
          </button>
          <button
            onClick={openRegister}
            className="btn-glow text-[13px] font-semibold text-white px-4 py-2 rounded-lg"
          >
            <span>Get Started</span>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {showAuth && (
          <AuthModal
            mode={authMode}
            onModeChange={setAuthMode}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
