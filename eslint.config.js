// @ts-check
/**
 * Configuration ESLint à la racine du monorepo.
 *
 * Sert principalement aux fichiers de config à la racine (commitlint.config.js,
 * prettier.config.js, eslint.config.js lui-même, etc.). Chaque paquet a son
 * propre `eslint.config.js` qui compose les presets de `@eduquiz/config`.
 *
 * On inclut aussi une entrée pour les fichiers Prisma de seed et scripts.
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
  // Override Next.js : autorise les default exports dans les fichiers spéciaux
  // Next.js des apps. lint-staged invoque ESLint depuis la racine du repo avec
  // le chemin complet apps/web/src/app/…, d'où les préfixes explicites.
  {
    files: [
      'apps/web/src/app/**/page.ts',
      'apps/web/src/app/**/page.tsx',
      'apps/web/src/app/**/layout.ts',
      'apps/web/src/app/**/layout.tsx',
      'apps/web/src/app/**/loading.ts',
      'apps/web/src/app/**/loading.tsx',
      'apps/web/src/app/**/error.ts',
      'apps/web/src/app/**/error.tsx',
      'apps/web/src/app/**/not-found.ts',
      'apps/web/src/app/**/not-found.tsx',
      'apps/web/src/app/**/template.ts',
      'apps/web/src/app/**/template.tsx',
      'apps/web/src/app/**/default.ts',
      'apps/web/src/app/**/default.tsx',
      'apps/web/src/app/**/route.ts',
      'apps/web/src/app/**/route.tsx',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  // Setup/tests E2E hors `src/` : lint-staged appelle ESLint depuis la racine,
  // donc on fournit un parseur TS explicite et on autorise le default export
  // Playwright du global setup.
  {
    files: ['apps/web/e2e/**/*.{ts,tsx}'],
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
      'import/no-default-export': 'off',
    },
  },
  ...prettier,
];
