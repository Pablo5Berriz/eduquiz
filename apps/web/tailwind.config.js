// @ts-check
/**
 * Configuration Tailwind d'@eduquiz/web.
 *
 * Étend la base partagée `@eduquiz/config/tailwind` avec les patterns
 * `content` propres à cette app (code source local + paquets partagés
 * qui produisent des classes Tailwind).
 */

import baseConfig from '@eduquiz/config/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: [
    './src/**/*.{ts,tsx}',
    // Scanner aussi les composants partagés pour que leurs classes ne
    // soient pas tree-shakées par JIT.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
