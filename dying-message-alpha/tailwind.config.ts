import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        raven: {
          bg: '#120d24',
          panel: '#21183f',
          panel2: '#35245f',
          gold: '#ffd33d',
          red: '#c93948',
          blue: '#255fbd',
          green: '#63e27a'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
