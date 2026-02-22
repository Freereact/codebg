import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1f232a',
        accent: '#f97316',
        title: '#e6f4ff',
        panel: '#2a2f38',
      },
    },
  },
  plugins: [],
} satisfies Config
