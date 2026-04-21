// Metro config pour Expo en monorepo pnpm.
//
// - `watchFolders` : on indique à Metro de surveiller aussi la racine
//   du monorepo et les paquets workspace pour que les imports
//   `@eduquiz/*` soient suivis en hot-reload.
// - `nodeModulesPaths` : on force Metro à résoudre les modules depuis
//   les `node_modules` de l'app ET de la racine, nécessaire avec pnpm
//   qui hoist certains paquets à la racine.
// - `symlinks` : Metro doit suivre les symlinks créés par pnpm vers les
//   paquets workspace.

const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
