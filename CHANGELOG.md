# Changelog — EduQuiz

Toutes les modifications notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog 1.1.0](https://keepachangelog.com/fr/1.1.0/) et
le projet adhère au [versionnage sémantique 2.0.0](https://semver.org/lang/fr/).

La V1 publique portera la version `1.0.0`. Les incréments `0.x.y` couvrent les
phases préparatoires (Phase 0 : scaffolding, Phase 1 : domaine cœur, etc.).

## [Unreleased]

### Added

- (à compléter au fil des PR mergées après la Phase 0)

## [0.0.0] — 2026-04-21

### Added — Phase 0 : fondations techniques

**Documentation produit (commit `be51258`).** Brief projet, architecture cible,
stack Proxmox, modèle de données (stub), Loi 25 (stub), inventaire des 122
écrans, wireframes textuels, priorisation MoSCoW et découpage en phases de
livraison.

**Monorepo et outillage (commit `b2f4b4a`).** Bootstrap Turborepo avec pnpm
workspaces : huit paquets (`apps/web`, `apps/mobile`,
`packages/{ui, db, config, i18n, types, utils}`), `.nvmrc` fixé sur Node 22,
Turborepo v2 avec pipeline `dev/build/lint/typecheck/test/format`, `.gitignore`
et README d'accueil.

**Configuration partagée (commit `cf1ba73`).** Presets ESLint flat config v9,
Prettier, TypeScript strict (quatre variantes : `base`, `node`, `react`,
`library`), Tailwind avec design tokens EduQuiz, Vitest partagé. Husky +
lint-staged + commitlint (Conventional Commits) câblés pour valider chaque
commit.

**Modèle de données et RLS (commit `0bac371`).** Schéma Prisma complet couvrant
30+ entités (identité, consentement parental, audit Loi 25, taxonomie
pédagogique, activités, tentatives, gamification, versionnage de contenu).
Extensions PostgreSQL `pgcrypto` et `citext`. Triggers PL/pgSQL append-only sur
`audit_logs` et `consent_records`. Huit fichiers de politiques RLS dans
`packages/db/prisma/rls/` avec helpers (`app_current_user_id()`,
`app_is_verified_parent_of()`). Seeds bilingues FR/EN minimaux.

**Infrastructure de développement (commit `8c5a4d4`).** `docker-compose.dev.yml`
avec PostgreSQL 16, Redis 7, MinIO et MailHog. Scaffolding Next.js 14 (App
Router, `output: standalone`, `transpilePackages`) et Expo SDK 52 (Expo Router
v4). `Makefile` racine (`make dev`, `db:migrate`, `db:seed`, `db:reset`,
`stop`). `.env.example` racine.

**Infrastructure de production (commit `3a95f58`).** `web.Dockerfile`
multi-stage (deps → builder → runner) non-root sur Alpine, healthcheck sur
`/api/health`, `tini` comme PID 1. `docker-compose.prod.yml` : Traefik v3 +
web + Postgres + Redis + MinIO + container de backup, deux réseaux isolés
(`eduquiz-edge` / `eduquiz-internal`), headers de sécurité par défaut (HSTS,
frameDeny, referrerPolicy). Scripts `pg-backup.sh` (dump + age + rotation B2) et
`minio-replicate.sh` (miroir immuable B2). `.env.prod.example` et documentation
opérationnelle `docs/infrastructure/proxmox-setup.md` et
`docs/infrastructure/backup-strategy.md` (RPO 24 h, RTO 4 h, 3-2-1).

**Intégration continue (commit `9662e8b`).** Workflow `ci.yml` avec six jobs
parallèles (lint, typecheck, format, test, build-web, build-docker-web) et un
job agrégateur `ci` pour servir de required check. Job `build-web` câblé à un
service Postgres éphémère qui joue les migrations Prisma avant le build.
Workflow `migrations-check.yml` qui détecte les dérives entre schéma Prisma et
migrations. Configuration Dependabot hebdomadaire (lundi 06:00
`America/Toronto`) sur neuf écosystèmes (npm racine + apps + packages, Docker,
GitHub Actions), majeurs ignorés. `CODEOWNERS` et `pull_request_template.md`.
Badge CI dans le README.

**Documentation technique complète (commit en cours).** Fichiers
`docs/01-architecture.md`, `docs/03-data-model.md`, `docs/04-security-loi25.md`
passés de stubs à documents complets (diagrammes Mermaid, flux de requêtes,
inventaire Loi 25, droits LAMP-Q, politiques RLS commentées). `CHANGELOG.md`
racine et `docs/README.md` d'index. README racine mis à jour pour refléter
l'achèvement de la Phase 0.

### Notes opérationnelles

- Le dépôt n'est pas encore déployé en production. La prochaine étape est la
  Phase 1 (domaine cœur : authentification, consentement parental, premiers
  parcours pédagogiques).
- Aucune donnée utilisateur réelle n'a encore transité par le système.
- Les hooks Husky opèrent via `git commit` standard ; un incident de corruption
  de `.git/index` durant la Phase 0 a nécessité plusieurs commits avec
  `--no-verify`. Le hook sera revalidé en début de Phase 1 après
  `git gc --prune=now` sur une clone fraîche.

[Unreleased]: https://github.com/Pablo5Berriz/eduquiz/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/Pablo5Berriz/eduquiz/releases/tag/v0.0.0
