/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        nyx: {
          bg: '#060709',
          card: '#0c0d12',
          surface: '#12141c',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-focus': 'rgba(255, 255, 255, 0.16)',
          accent: '#10b981',
          dim: '#8a8f9c',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3.5s ease-in-out infinite',
        'glow-breathe': 'glowBreathe 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        glowBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.35' },
          '50%': { transform: 'scale(1.08)', opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
