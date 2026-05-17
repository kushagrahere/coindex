import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden:  { opacity: 0, scale: 0.94, y: 24 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', damping: 28, stiffness: 340 } },
  exit:    { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2 } },
};

const InputField = ({ label, type = 'text', value, onChange, placeholder, autoComplete }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-[#64748b]">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="input-cosmic w-full px-4 py-3 rounded-xl text-[14px] font-body"
    />
  </div>
);

export default function AuthModal({ mode, onModeChange, onClose }) {
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate  = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = isLogin
      ? await login(email, password)
      : await register(email, username, password);
    if (ok) {
      onClose();
      navigate('/dashboard');
    }
  };

  const switchMode = (m) => {
    clearError();
    setEmail(''); setPassword(''); setUsername('');
    onModeChange(m);
  };

  return (
    <motion.div
      variants={backdrop}
      initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(4,4,13,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        variants={panel}
        className="relative w-full max-w-md rounded-2xl p-8 glass-bright shadow-glass"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#94a3b8] hover:bg-white/5 transition-all"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="neon-dot" />
            <span className="text-[11px] font-mono text-[#10b981] tracking-wider uppercase">
              Secure Connection
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#f1f5f9] mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-[13px] text-[#64748b]">
            {isLogin
              ? 'Sign in to access your trading dashboard'
              : 'Start trading with ₹10,00,000 paper balance'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                mode === m
                  ? 'bg-violet-DEFAULT text-white shadow-glow-sm'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Demo hint */}
        {isLogin && (
          <button
            onClick={() => { setEmail('demo@coindex.in'); setPassword('Demo@1234'); }}
            className="w-full mb-4 px-4 py-2.5 rounded-xl text-[12px] font-mono text-[#7c3aed] transition-all hover:bg-white/5"
            style={{ border: '1px dashed rgba(124,58,237,0.3)' }}
          >
            ← Use demo account: demo@coindex.in / Demo@1234
          </button>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <InputField
                  label="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="trader_xyz"
                  autoComplete="username"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[12px] text-down px-4 py-3 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-glow w-full py-3.5 rounded-xl font-semibold text-[14px] text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} →</>
              )}
            </span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#475569] mt-5">
          By continuing you agree to our{' '}
          <span className="text-[#7c3aed] cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#7c3aed] cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </motion.div>
    </motion.div>
  );
}
