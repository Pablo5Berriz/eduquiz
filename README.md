# EduQuiz

[![CI](https://github.com/Pablo5Berriz/eduquiz/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Pablo5Berriz/eduquiz/actions/workflows/ci.yml)

Plateforme éducative bilingue FR/EN pour élèves québécois du Primaire 3 à la
Secondaire 5. Mode libre uniquement (B2C).

Monorepo Turborepo + pnpm workspaces, Node 22 LTS, TypeScript strict.

- **Phase 0** (scaffolding et fondations techniques) majoritairement livrée.
- **Phase 1** est livrée partiellement : vitrine publique, auth adulte et
  paramètres de compte existent, mais le produit pédagogique complet n'est pas
  encore livré.

Le statut détaillé et à jour se trouve dans
[`docs/09-implementation-status.md`](./docs/09-implementation-status.md).

État actuellement utilisable :

- Vitrine publique bilingue (38 écrans : home, fonctionnalités, 10 matières, 9
  niveaux scolaires, tarifs, FAQ, blog, contact, pages légales)
- Inscription adulte avec vérification d'email (Argon2id, OWASP 2024)
- Connexion (Credentials + OAuth Google/Apple conditionnels), mot de passe
  oublié, réinitialisation
- Espace authentifié : profil, édition profil, changement mot de passe,
  paramètre langue, export Loi 25, suppression de compte (soft delete + délai de
  grâce 30 jours)
- Audit des actions principales (`AuditLog` append-only) + RLS préparé + rate
  limiting Redis
- Logger structuré JSONL + propagation `x-request-id` + healthcheck
  `/api/health` (app + DB)

Non encore livré : moteur d'exercices, moteur de quiz, progression pédagogique,
dashboard parent, flux mineur complet, Stripe, tests E2E web/mobile.

## Structure du monorepo

```
eduquiz/
├── apps/
│   ├── web/          # Application Next.js 14 (vitrine, app, admin)
│   └── mobile/       # Application Expo SDK 52 (squelette)
├── packages/
│   ├── ui/           # Composants React partagés (tailwind-variants)
│   ├── db/           # Schéma Prisma + client PostgreSQL + RLS
│   ├── auth/         # Auth.js v5 backbone (split Edge/Node)
│   ├── email/        # nodemailer + templates HTML bilingues
│   ├── rate-limit/   # Bucket fenêtre fixe Redis (mode no-op si absent)
│   ├── config/       # Configs partagées (TS, ESLint, Prettier, Tailwind)
│   ├── i18n/         # Traductions FR/EN (FR par défaut)
│   ├── types/        # Types TypeScript de domaine
│   └── utils/        # Utilitaires purs
├── infra/
│   └── docker/       # Dockerfile web, compose dev/prod, scripts backup
├── docs/             # Documentation produit, technique et infrastructure
└── .cowork/          # Instructions permanentes pour l'agent Cowork
```

## Documentation

L'index complet se trouve dans [`docs/README.md`](./docs/README.md). Points
d'entrée essentiels :

- Architecture applicative :
  [`docs/01-architecture.md`](./docs/01-architecture.md)
- Modèle de données et RLS : [`docs/03-data-model.md`](./docs/03-data-model.md)
- Conformité Loi 25 : [`docs/04-security-loi25.md`](./docs/04-security-loi25.md)
- Déploiement Proxmox :
  [`docs/infrastructure/proxmox-setup.md`](./docs/infrastructure/proxmox-setup.md)
- Sauvegardes et restauration :
  [`docs/infrastructure/backup-strategy.md`](./docs/infrastructure/backup-strategy.md)

## Prérequis

- **Node.js 22 LTS** (voir `.nvmrc`). Avec `nvm` : `nvm use`.
- **pnpm 9.12+**. Installation :
  `corepack enable && corepack prepare pnpm@9.12.3 --activate`.
- **Docker** et **Docker Compose** pour la pile de dev (Postgres, Redis, MinIO,
  MailHog).
- **Git** avec Conventional Commits (hook Husky activé automatiquement par
  `pnpm install`).

## Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/Pablo5Berriz/eduquiz.git
cd eduquiz

# Utiliser la bonne version Node
nvm use   # lit .nvmrc (Node 22)

# Installer les dépendances (monorepo complet)
pnpm install

# Démarrer la pile de dev (postgres, redis, mailhog, minio)
make dev

# Appliquer les migrations Prisma et les seeds
make db:migrate
make db:seed

# Lancer tous les workspaces en mode développement
pnpm dev

# Vérifier lint, types et tests sur tout le monorepo
pnpm lint
pnpm typecheck
pnpm test

# Formater le code
pnpm format
```

Le `Makefile` racine regroupe les commandes usuelles de la pile de dev
(`make dev`, `make stop`, `make db:migrate`, `make db:seed`, `make db:reset`).
Les détails sont documentés dans `infra/docker/README.md`.

## Intégration continue

Le workflow [`ci.yml`](./.github/workflows/ci.yml) exécute en parallèle :
`lint`, `typecheck`, `format`, `test`, `build-web` (avec un service Postgres
éphémère pour les migrations) et `build-docker-web` (build multi-stage + smoke
test de l'image). Le job agrégateur `ci` sert de required check pour merge.

Dependabot scanne chaque lundi à 06:00 (America/Toronto) neuf écosystèmes (npm
racine, apps, packages, Docker, GitHub Actions). Les bumps majeurs sont ignorés
automatiquement pour revue manuelle.

## Workflow Git

- Branche principale : `main`. Pas de GitFlow, trunk-based.
- Commits : [Conventional Commits](https://www.conventionalcommits.org/).
- Hooks Husky : `lint-staged` (prettier + eslint) avant chaque commit,
  commitlint sur le message.
- Template PR :
  [`.github/pull_request_template.md`](./.github/pull_request_template.md).

## Consignes permanentes Cowork

Les consignes de travail pour l'agent Cowork se trouvent dans
`.cowork/instructions.md`. Ce fichier doit être relu au début de chaque session
avant toute action.

## Contacts

- Responsable projet : Paul Quentin (<paulquentin4@gmail.com>).
- Responsable de la protection des renseignements personnels (RPRP) : Solutions
  Infos (<solutionsinfos2023@gmail.com>).

## Licence

Propriétaire — Copyright © 2026 Solutions Infos. Voir `LICENSE`.
