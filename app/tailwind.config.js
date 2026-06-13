/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep, slightly cool charcoal ramp (richer blacks for depth)
        charcoal: {
          DEFAULT: '#16181b',
          950: '#0f1113',
          900: '#141619',
          800: '#1a1d21',
          750: '#1f2329',
          700: '#23272d',
          600: '#2c3138',
          500: '#363c44',
        },
        // Saffron accent
        saffron: {
          DEFAULT: '#f5a623',
          light: '#ffc15e',
          dark: '#d8860b',
        },
        // Emerald highlight
        emerald: {
          DEFAULT: '#1fb574',
          light: '#36d995',
          dark: '#138a57',
        },
        ink: {
          DEFAULT: '#f4f5f7',
          muted: '#a2a8b2',
          faint: '#6c727c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.375rem', // 22px — premium large card radius
        '3xl': '1.75rem',
      },
      letterSpacing: {
        tightish: '-0.01em',
      },
      boxShadow: {
        // Soft, layered elevation (Apple/WHOOP-like depth, not harsh)
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -16px rgba(0,0,0,0.7)',
        elevated: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 48px -20px rgba(0,0,0,0.8)',
        sheet: '0 -10px 50px -16px rgba(0,0,0,0.75)',
        'glow-saffron': '0 8px 24px -8px rgba(245,166,35,0.45)',
        'glow-emerald': '0 8px 24px -8px rgba(31,181,116,0.4)',
      },
      keyframes: {
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop': { '0%': { transform: 'scale(0.96)', opacity: '0.6' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1)',
        'pop': 'pop 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
