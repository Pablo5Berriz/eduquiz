// @ts-check
/**
 * Configuration ESLint partagée du monorepo EduQuiz.
 *
 * Flat config v9. Exporte plusieurs presets nommés que les paquets
 * importent et composent selon leur nature :
 *
 *   import { base, react, nextjs, node } from '@eduquiz/config/eslint';
 *   export default [...base, ...react, ...nextjs];
 *
 * Règles non négociables (issues de .cowork/instructions.md) :
 *   - pas de `any` sans commentaire `// @justify-any: ...`
 *   - pas de `console.log` en production (warning, sauf .warn et .error)
 *   - composants React : fonctions nommées, default export uniquement pages
 *   - hooks préfixés `use`
 */

import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Préset de base : JavaScript et TypeScript stricts, sans React.
 * À utiliser pour packages/db, packages/utils, packages/types,
 * packages/i18n, packages/config.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const base = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/*.generated.*',
    ],
  },

  // Règles communes JS + TS (non type-aware)
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Imports tri et hygiène
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-default-export': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',

      // Console : seul .warn et .error tolérés
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Cohérence du code
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Règles TypeScript strictes (type-aware, uniquement sur les sources TS).
  // On exclut volontairement les fichiers de config à la racine des paquets,
  // qui ne sont pas couverts par les tsconfig (rootDir: "src").
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/src/**/*.{ts,tsx,mts,cts}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/src/**/*.{ts,tsx,mts,cts}'],
  })),
  {
    files: ['**/src/**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Pas de any sans justification explicite
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],

      // Pas de variables non utilisées (sauf préfixées _)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Fichiers de config TS à la racine des paquets (vitest, etc.) :
  // parseur TypeScript sans type-awareness (pas de tsconfig associé).
  {
    files: [
      '**/*.config.{ts,mts,cts}',
      '**/vitest.config.{ts,mts,cts}',
      '**/vitest.config.base.{ts,mts,cts}',
      '**/next.config.{ts,mts,cts}',
      '**/postcss.config.{ts,mts,cts}',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
  },

  // Fichiers de config (tous langages) : default export nécessaire,
  // pas de règles type-aware ni no-console.
  {
    files: [
      '**/*.config.{ts,js,mjs,cjs}',
      '**/eslint.config.{js,mjs,cjs}',
      '**/prettier.config.{js,mjs,cjs}',
      '**/tailwind.config.{js,mjs,cjs}',
      '**/tailwind-config-base.{js,mjs,cjs}',
      '**/vitest.config.{ts,js,mjs,cjs}',
      '**/vitest.config.base.{ts,js,mjs,cjs}',
      '**/commitlint.config.{js,mjs,cjs}',
      '**/next.config.{ts,js,mjs,cjs}',
      '**/postcss.config.{ts,js,mjs,cjs}',
    ],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      'no-console': 'off',
    },
  },
];

/**
 * Préset React (composants + hooks + accessibilité).
 * À utiliser pour packages/ui, et combiné avec nextjs ou expo selon l'app.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const react = [
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // Hooks doivent commencer par "use"
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Composants : fonctions nommées (pas de displayName auto via const)
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],

      // Default export interdit sauf pour pages Next.js (override plus bas)
      // — déjà géré par import/no-default-export du préset base.

      // Plus besoin d'importer React en JSX
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
];

/**
 * Préset Next.js : autorise default export pour les pages et layouts.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const nextjs = [
  {
    files: [
      '**/app/**/page.{ts,tsx}',
      '**/app/**/layout.{ts,tsx}',
      '**/app/**/loading.{ts,tsx}',
      '**/app/**/error.{ts,tsx}',
      '**/app/**/not-found.{ts,tsx}',
      '**/app/**/template.{ts,tsx}',
      '**/app/**/route.{ts,tsx}',
      '**/middleware.{ts,tsx}',
      '**/next.config.{js,mjs,ts}',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];

/**
 * Préset Node : globals Node, no-console désactivé pour scripts CLI.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const node = [
  {
    files: ['**/scripts/**/*.{ts,js}', '**/*.config.{ts,js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'import/no-default-export': 'off',
    },
  },
];

/**
 * Compatibilité Prettier (à mettre EN DERNIER pour désactiver les règles
 * de format conflictuelles).
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const prettier = [prettierConfig];

/**
 * Préset par défaut : base + prettier. Pour les paquets non React.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [...base, ...prettier];
