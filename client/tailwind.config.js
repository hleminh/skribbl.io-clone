const colors = require('./node_modules/tailwindcss/colors');

module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        orange: colors.orange,
      },
      cursor: {
        none: 'none'
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
