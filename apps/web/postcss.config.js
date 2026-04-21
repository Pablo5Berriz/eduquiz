/**
 * PostCSS pour @eduquiz/web.
 *
 * Tailwind 3 + Autoprefixer, pipeline standard. Les tokens et presets
 * sont importés depuis `@eduquiz/config/tailwind` (voir tailwind.config.js).
 *
 * Fichier ESM (`package.json` déclare `"type": "module"`), donc on
 * exporte via `export default` plutôt que `module.exports`.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
