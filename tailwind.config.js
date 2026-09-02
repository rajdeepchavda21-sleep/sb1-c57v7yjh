/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0A10',
        surface: {
          DEFAULT: '#13121A',
          elevated: '#1A1822',
        },
        border: {
          DEFAULT: '#292633',
          hover: '#3A3644',
        },
        primary: {
          DEFAULT: '#7C5CFC',
          hover: '#8B72FF',
          muted: 'rgba(124, 92, 252, 0.12)',
        },
        text: {
          primary: '#F5F3FA',
          secondary: '#A7A3B5',
          muted: '#6F6A7D',
        },
        success: '#35D07F',
        warning: '#F5B942',
        error: '#FF5C6C',
        info: '#5C9DFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        h1: ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h2: ['20px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h3: ['16px', { lineHeight: '1.3' }],
        body: ['14px', { lineHeight: '1.5' }],
        small: ['12px', { lineHeight: '1.5' }],
        tiny: ['11px', { lineHeight: '1.4' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
      borderRadius: {
        small: '6px',
        medium: '10px',
        large: '14px',
        pill: '999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(124, 92, 252, 0.25)',
        'glow-hover': '0 0 28px rgba(124, 92, 252, 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-8px) scale(0.95)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-up': 'slide-in-up 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin': 'spin 0.8s linear infinite',
        'toast-in': 'toast-in 0.2s ease-out',
        'toast-out': 'toast-out 0.2s ease-in forwards',
        'scale-in': 'scale-in 0.15s ease-out',
        'shimmer': 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
