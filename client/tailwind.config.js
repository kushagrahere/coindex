/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg:      '#04040d',
          surface: '#080814',
          card:    'rgba(255,255,255,0.03)',
          border:  'rgba(255,255,255,0.07)',
          'border-bright': 'rgba(255,255,255,0.14)',
        },
        violet: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          glow:    'rgba(124,58,237,0.35)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light:   '#67e8f9',
          glow:    'rgba(6,182,212,0.3)',
        },
        up:   '#10b981',
        down: '#f43f5e',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        ticker:       'ticker 40s linear infinite',
        'ticker-slow': 'ticker 80s linear infinite',
        float:        'float 7s ease-in-out infinite',
        'float-delay':'float 7s ease-in-out 3.5s infinite',
        pulseGlow:    'pulseGlow 3s ease-in-out infinite',
        fadeUp:       'fadeUp 0.7s ease forwards',
        shimmer:      'shimmer 2s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(var(--tw-gradient-stops))',
        shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow:   '0 0 24px rgba(124,58,237,0.4), 0 0 64px rgba(124,58,237,0.15)',
        'glow-cyan': '0 0 24px rgba(6,182,212,0.4), 0 0 64px rgba(6,182,212,0.12)',
        'glow-sm': '0 0 12px rgba(124,58,237,0.3)',
      },
      backdropBlur: { xs: '4px', '2xl': '40px' },
    },
  },
  plugins: [],
};
