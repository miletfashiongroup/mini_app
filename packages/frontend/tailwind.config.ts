import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'gray-light': '#D9D9D9',
        'gray-dark': '#29292B',
        'blue-dark': '#000043',
        'blue-mid': '#1F1F4B',
        sand: '#F3EEE2',
        'sand-dark': '#E0D6C2',
        'accent-peach': '#FF6B6B',
        'accent-orange': '#FFB347',
        'brand-black': '#05050A',
      },
      fontFamily: {
        brand: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
