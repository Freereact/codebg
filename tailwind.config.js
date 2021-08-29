module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      black: '#004242',
      orange: '#e06900',
      blue: '#0087bd',
      white: '#FFFAF0',
      gray: '#E0E0E0',
    },
    fontFamily: {
      sans: ['Montserrat', 'sans-serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
