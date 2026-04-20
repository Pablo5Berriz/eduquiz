// @ts-check

/**
 * Configuration commitlint pour le monorepo EduQuiz.
 *
 * Repose sur Conventional Commits avec des types étendus pour mieux
 * refléter le cycle de développement multi-paquets.
 *
 * Format : <type>(<scope>): <subject>
 *
 * Exemples valides :
 *   feat(web): add login page
 *   fix(db): correct rls policy on parent_child_link
 *   chore(ci): bump pnpm version
 *   docs(architecture): update mermaid diagram
 *
 * @type {import('@commitlint/types').UserConfig}
 */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // nouvelle fonctionnalité
        'fix', // correctif de bug
        'docs', // documentation
        'style', // formatage sans impact logique
        'refactor', // refactoring sans changement comportemental
        'perf', // amélioration de performance
        'test', // ajout ou correction de tests
        'build', // build system, dépendances
        'ci', // configuration CI
        'chore', // tâches diverses, maintenance
        'revert', // annulation d'un commit
      ],
    ],
    'scope-enum': [
      1,
      'always',
      [
        // Apps
        'web',
        'mobile',
        // Packages
        'ui',
        'db',
        'config',
        'i18n',
        'types',
        'utils',
        // Transverses
        'infra',
        'ci',
        'docs',
        'deps',
        'release',
        // Domaines métier
        'auth',
        'content',
        'quiz',
        'exercise',
        'parent',
        'admin',
        'payment',
        'gamification',
        'i18n-content',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [0], // Les lignes de body peuvent être longues (URLs, blocs)
  },
};

export default config;
