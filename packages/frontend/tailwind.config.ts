import { type Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        gray: {
          50: '#F5F5F5',
          100: '#D9D9D9',
          200: '#A0A0A0',
        },
        text: {
          primary: '#29292B',
          secondary: '#A0A0A0',
        },
        accent: '#000043',
        success: '#53923D',
      },
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
      },
      borderRadius: {
        xl: '25px',
        'label-sm': '6.03px',
      },
      spacing: {
        'section-y': '2rem',
        51: '51px',
        37: '37px',
        143: '143px',
      },
      fontSize: {
        h2: ['45pt', { lineHeight: '1.1', fontWeight: '700' }],
      },
      boxShadow: {
        subtle: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
