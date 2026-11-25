/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#121212',
        onyx: '#1E1E1E',
        charcoal: '#262626',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E6C65A',
          pale: '#F5E6B3',
          dark: '#AA8822',
          muted: 'rgba(212, 175, 55, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        gold: '0 0 24px -4px rgba(212, 175, 55, 0.28)',
        'gold-sm': '0 0 12px -2px rgba(212, 175, 55, 0.22)',
        luxury: '0 16px 40px -12px rgba(0, 0, 0, 0.65)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E6C65A 0%, #D4AF37 50%, #AA8822 100%)',
        'dark-radial': 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.10), transparent 55%)',
      },
    },
  },
  plugins: [],
};
