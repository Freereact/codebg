import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: '#2a2f36',
        'shell-border': '#3a414b',
        surface: '#f6f6f3',
        'surface-border': '#d8d8d2',
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          soft: '#fff7ed',
          'soft-border': '#fdba74',
          text: '#c2410c',
          'text-hover': '#9a3412',
        },
        title: '#e6f4ff',
      },
    },
  },
  plugins: [],
} satisfies Config
