# EduQuiz

[![CI](https://github.com/Pablo5Berriz/eduquiz/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Pablo5Berriz/eduquiz/actions/workflows/ci.yml)

Plateforme éducative bilingue FR/EN pour élèves québécois du Primaire 3 à la
Secondaire 5. Mode libre uniquement (B2C).

Monorepo Turborepo + pnpm workspaces, Node 22 LTS, TypeScript strict.

## Structure du monorepo

```
eduquiz/
├── apps/
│   ├── web/          # Application Next.js 14 (vitrine, app, admin)
│   └── mobile/       # Application Expo SDK 50+
├── packages/
│   ├── ui/           # Composants React partagés (shadcn + NativeWind)
│   ├── db/           # Schéma Prisma + client PostgreSQL
│   ├── config/       # Configs partagées (TS, ESLint, Prettier, Tailwind)
│   ├── i18n/         # Traductions FR/EN (FR par défaut)
│   ├── types/        # Types TypeScript de domaine
│   └── utils/        # Utilitaires purs
├── docs/             # Documentation produit et technique
└── .cowork/          # Instructions permanentes pour l'agent Cowork
```

## Documentation

| Fichier                        | Contenu                                   |
| ------------------------------ | ----------------------------------------- |
| `docs/00-project-brief.md`     | Description complète du projet            |
| `docs/01-architecture.md`      | Architecture technique (complété Phase 0) |
| `docs/02-stack-proxmox.md`     | Stack et hébergement Proxmox              |
| `docs/03-data-model.md`        | Modèle de données Prisma                  |
| `docs/04-security-loi25.md`    | Conformité Loi 25                         |
| `docs/05-screens-inventory.md` | Inventaire des 122 écrans                 |
| `docs/06-wireframes.md`        | Wireframes textuels                       |
| `docs/07-moscow-priorities.md` | Priorisation MoSCoW                       |
| `docs/08-delivery-phases.md`   | Découpage en phases de livraison          |

## Prérequis

- **Node.js 22 LTS** (voir `.nvmrc`). Avec `nvm` : `nvm use`.
- **pnpm 9.12+**. Installation :
  `corepack enable && corepack prepare pnpm@9.12.3 --activate`.
- **Docker** et **Docker Compose** (étape 0.4) pour Postgres, MinIO, Redis et
  Traefik en dev local.
- **Git** avec Conventional Commits (hook Husky activé automatiquement).

## Démarrage rapide

Le projet est actuellement en Phase 0 (scaffolding). Les commandes de dev
deviendront pleinement fonctionnelles au fil des étapes 0.2 à 0.7.

```bash
# Cloner le dépôt
git clone https://github.com/Pablo5Berriz/eduquiz.git
cd eduquiz

# Utiliser la bonne version Node
nvm use   # lit .nvmrc (Node 22)

# Installer les dépendances (monorepo complet)
pnpm install

# Lancer tous les workspaces en dev (étape 0.4 requise)
pnpm dev

# Vérifier lint, types et tests sur tout le monorepo
pnpm lint
pnpm typecheck
pnpm test

# Formater le code
pnpm format
```

## Workflow Git

- Branche principale : `main`. Pas de GitFlow, trunk-based.
- Commits : [Conventional Commits](https://www.conventionalcommits.org/).
- Un push sur `main` déclenchera le déploiement (staging/prod à venir).
- Hooks Husky (étape 0.2) exécutent `lint-staged` avant chaque commit.

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
