// @ts-check
/**
 * Configuration ESLint à la racine du monorepo.
 *
 * Sert uniquement aux fichiers de config à la racine (commitlint.config.js,
 * prettier.config.js, eslint.config.js lui-même, etc.). Chaque paquet a son
 * propre `eslint.config.js` qui compose les presets de `@eduquiz/config`.
 */

import { base, prettier } from '@eduquiz/config/eslint';

export default [...base, ...prettier];
