import { base, node, prettier } from '@eduquiz/config/eslint';

export default [
  { ignores: ['dist/**', '.turbo/**'] },
  ...base,
  ...node,
  ...prettier,
];
