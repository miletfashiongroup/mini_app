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
        brace: {
          black: '#000000',
          slate: '#000043',
          zinc: '#28282A',
          lime: '#52913D',
          neutral: '#A2A2A2',
          surface: '#D9D9D9',
          white: '#FFFFFF',
          red300: '#ED9595',
          red600: '#FF0000',
        },
      },
      fontFamily: {
        brand: ['"Inter"', 'system-ui', 'sans-serif'],
        montserrat: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.75rem',
        brace: '24px',
      },
      maxWidth: {
        'brace-container': '1080px',
      },
      spacing: {
        'brace-section': '34px',
      },
      fontSize: {
        display: ['96px', { lineHeight: '1', letterSpacing: '-0.03em' }],
        heading: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        subheading: ['36px', { lineHeight: '1.1' }],
        body: ['30px', { lineHeight: '1.25' }],
        caption: ['20px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
