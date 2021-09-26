const colors = require('./node_modules/tailwindcss/colors');
const plugin = require("tailwindcss/plugin");

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
    extend: {
      opacity: ['disabled'],
    },
  },
  plugins: [
    plugin(function ({ addUtilities, theme, config }) {
      const themeColors = theme('colors');

      addUtilities({
        '.border-b-blue-500': {
          borderBottomColor: themeColors['blue']['500'],
        }
      });
    })
  ],
}
