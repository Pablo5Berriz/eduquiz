// @ts-check
/**
 * Configuration ESLint à la racine du monorepo.
 *
 * Sert principalement aux fichiers de config à la racine (commitlint.config.js,
 * prettier.config.js, eslint.config.js lui-même, etc.). Chaque paquet a son
 * propre `eslint.config.js` qui compose les presets de `@eduquiz/config`.
 *
 * On inclut aussi une entrée pour `**\/prisma/seed.ts` et `**\/prisma/scripts/**`
 * afin que `lint-staged` (qui lance ESLint depuis la racine) puisse linter ces
 * fichiers hors `src/` sans avertir « File ignored because no matching
 * configuration was supplied ».
 */

import { base, node, prettier, tsParser, tsPlugin } from '@eduquiz/config/eslint';

export default [
  ...base,
  ...node,
  // Seeds Prisma et scripts hors `src/` : parseur TS sans type-awareness,
  // `console` autorisé (scripts CLI).
  {
    files: ['**/prisma/seed.ts', '**/prisma/scripts/**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'off',
    },
  },
  ...prettier,
];
