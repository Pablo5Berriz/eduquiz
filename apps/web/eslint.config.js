import { base, nextjs, prettier, react } from '@eduquiz/config/eslint';

export default [
  { ignores: ['.next/**', 'out/**', 'dist/**', '.turbo/**', 'node_modules/**', 'next-env.d.ts'] },
  ...base,
  ...react,
  ...nextjs,
  // Override local : autorise les default exports dans les fichiers spéciaux
  // Next.js. Complète le préset partagé pour les chemins contenant des route
  // groups ([locale], (authenticated)…) que certains glob engines ne matchent
  // pas fiablement via **/app/**/page.{ts,tsx}.
  {
    files: [
      '**/page.tsx',
      '**/page.ts',
      '**/layout.tsx',
      '**/layout.ts',
      '**/loading.tsx',
      '**/error.tsx',
      '**/not-found.tsx',
      '**/template.tsx',
      '**/default.tsx',
      '**/route.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  ...prettier,
];
