import { base, nextjs, prettier, react } from '@eduquiz/config/eslint';

export default [
  { ignores: ['.next/**', 'out/**', 'dist/**', '.turbo/**', 'node_modules/**', 'next-env.d.ts'] },
  ...base,
  ...react,
  ...nextjs,
  ...prettier,
];
