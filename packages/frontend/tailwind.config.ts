import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#111418',
        primary: '#0f172a',
        secondary: '#94a3b8',
      },
    },
  },
  plugins: [],
} satisfies Config;
