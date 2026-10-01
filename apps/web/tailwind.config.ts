import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      tablet: '768px',
      lg: '1024px',
      desktop: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#080B18',
          card: '#12182A',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        'deep-navy': {
          DEFAULT: '#0D1326',
          surface: '#12182A',
        },
        aurora: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          dark: '#14532D',
        },
        emerald: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#DCFCE7',
        },
        soft: {
          text: '#64748B',
          background: '#F8FAFC',
        },
        dark: {
          text: '#0F172A',
          surface: '#0F3A22',
        },
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-light': 'var(--color-primary-light)',
        glass: 'var(--color-glass)',
        charcoal: 'var(--color-charcoal)',
        background: 'var(--color-background)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '20px',
        'section': '32px',
        'bento': '28px',
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px rgba(22, 163, 74, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
