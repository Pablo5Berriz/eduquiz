import { base, expo, prettier, react } from '@eduquiz/config/eslint';

export default [
  { ignores: ['.expo/**', 'dist/**', '.turbo/**', 'node_modules/**', 'expo-env.d.ts'] },
  ...base,
  ...react,
  ...expo,
  ...prettier,
];
