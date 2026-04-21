/**
 * PostCSS pour @eduquiz/web.
 *
 * Tailwind 3 + Autoprefixer, pipeline standard. Les tokens et presets
 * sont importés depuis `@eduquiz/config/tailwind` (voir tailwind.config.js).
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
