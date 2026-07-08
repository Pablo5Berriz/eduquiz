import { base, expo, prettier, react } from '@eduquiz/config/eslint';

export default [
  { ignores: ['.expo/**', 'dist/**', '.turbo/**', 'node_modules/**', '**/node_modules/**', 'expo-env.d.ts'] },
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'import/no-cycle': 'off',
    },
  },
  ...react,
  ...expo,
  ...prettier,
];
