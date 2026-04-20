import { base, node, prettier, tsParser, tsPlugin } from '@eduquiz/config/eslint';

export default [
  // Ignorer le client Prisma auto-généré et tout le SQL (non linté).
  {
    ignores: ['src/generated/**', 'prisma/migrations/**', 'prisma/rls/**', 'dist/**', '.turbo/**'],
  },
  ...base,
  ...node,
  ...prettier,
  // Le seed Prisma et les futurs scripts vivent hors `src/` : on les rattache
  // explicitement à ESLint avec un parseur TS non type-aware (pas de tsconfig
  // couvrant `prisma/`), et on autorise `console` pour les scripts.
  {
    files: ['prisma/seed.ts', 'prisma/scripts/**/*.ts'],
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
];
