/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep charcoal surfaces
        charcoal: {
          DEFAULT: '#1a1c1e',
          900: '#141517',
          800: '#1a1c1e',
          700: '#222528',
          600: '#2b2f33',
          500: '#363b40',
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
          DEFAULT: '#f3f4f6',
          muted: '#9ca3af',
          faint: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        sheet: '0 -8px 40px -12px rgba(0,0,0,0.7)',
      },
      keyframes: {
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop': { '0%': { transform: 'scale(0.96)', opacity: '0.6' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pop': 'pop 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
