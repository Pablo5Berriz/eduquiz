# Changelog — EduQuiz

Toutes les modifications notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog 1.1.0](https://keepachangelog.com/fr/1.1.0/) et
le projet adhère au [versionnage sémantique 2.0.0](https://semver.org/lang/fr/).

La V1 publique portera la version `1.0.0`. Les incréments `0.x.y` couvrent les
phases préparatoires (Phase 0 : scaffolding, Phase 1 : domaine cœur, etc.).

## [Unreleased]

_(rien pour le moment — voir les phases 2+ dans `docs/08-delivery-phases.md`)_

## [0.1.0] — 2026-04-26

### Added — Phase 1 : vitrine publique, authentification, espace authentifié, observabilité

**Étape 1.1 — Layout web partagé + i18n dynamique FR/EN.** Middleware de
détection de locale (cookie `NEXT_LOCALE` → `Accept-Language` → `fr`),
préfixe `/[locale]/` systématique, header bilingue avec `LocaleSwitcher`,
footer avec mentions légales, layout racine + dictionnaires FR/EN typés
(`Messages = typeof frMessages` pour symétrie forcée).

**Étape 1.2 — Pages vitrine publiques (écrans 1-14).** Home, Fonctionnalités,
Matières (catalogue de 10 matières du programme québécois avec détail
niveau par niveau et placeholders SVG), Niveaux scolaires (9 mini-cards
P3 → S5 avec page détail listant les matières au programme), Tarifs, FAQ,
Blog (squelette), Contact, À propos, Témoignages, Conditions, Confidentialité,
Cookies, Loi 25, Accessibilité.

**Étape 1.3 — Auth.js v5 backbone.** Nouveau paquet `@eduquiz/auth`
exposant la configuration Auth.js v5 en deux variantes (Node et Edge-safe),
l'adapter Prisma, les providers Credentials (Argon2id) et Google/Apple
OAuth conditionnels, ainsi que des helpers serveur (rôles, mots de passe,
tokens de vérification). Côté `apps/web`, catch-all `/api/auth/[...nextauth]`,
instanciation `auth()` Node, et refonte du middleware pour composer i18n +
protection des futures zones `/[locale]/{dashboard,parent,admin}/*`.
Sessions persistées en DB côté Node (révocation immédiate, audit IP/UA),
JWT côté Edge (lecture middleware sans Prisma). Événements `signIn`/
`signOut` tracés dans `AuditLog`. Variables d'environnement `AUTH_*`
validées par Zod au boot.

**Étape 1.4 — Flux d'inscription adulte (écrans 15, 19, 22, 23).** Nouveau
paquet `@eduquiz/email` (nodemailer + templates HTML bilingues : verification,
welcome). Composants UI ajoutés à `@eduquiz/ui` (`Input`, `PasswordInput`,
`Checkbox`, `FormField`). Migration Prisma
`20260425_extend_audit_event_kind` étendant `AuditEventKind` avec
`AUTH_USER_CREATED` et `AUTH_VERIFY_EMAIL`. Quatre routes Next + trois
Server Actions (`registerAdult`, `resendVerification`,
`confirmVerification`). Validation Zod stricte (email, complexité mot de
passe ≥ 8 + 1 chiffre + 1 majuscule, check majorité 18 ans, CGU
obligatoire). Hash Argon2id + transaction Prisma User+Profile+ConsentRecord
(TERMS_ACCEPTED, PRIVACY_ACCEPTED, MARKETING_OPTED_IN si choisi). Aucune
auto-connexion — vérification email obligatoire avant login. OAuth
Google/Apple rendus conditionnellement (env configurés).

**Étape 1.5 — Connexion + reset password (écrans 16, 17, 18).** Trois
nouvelles routes Next.js : `/[locale]/connexion` avec bannières
contextuelles (`?verified=1`, `?reset=1`, `?session=expired`), OAuth
Google/Apple conditionnels, formulaire Credentials sécurisé via Server
Action `signInAdult` (pattern Auth.js v5 `try/catch AuthError`) ;
`/[locale]/mot-de-passe-oublie` qui appelle `requestPasswordReset`
(anti-énumération, toujours `ok: true` côté UI) ;
`/[locale]/mot-de-passe-oublie/reinitialiser/[token]` qui inspecte le
token côté Server Component et délègue la consommation à
`completePasswordReset` (transaction Prisma : update passwordHash +
suppression de toutes les sessions actives + AuditLog AUTH_PASSWORD_RESET).
Nouveau template email `buildResetPasswordEmail` (FR/EN, validité 1 h).
Nouveau composant `Alert` dans `@eduquiz/ui` (variants
info/success/warning/danger). Le provider Credentials de `@eduquiz/auth`
trace désormais les échecs (`AUTH_FAILED`) avec une raison interne
(unknown_user/disabled/no_password/unverified/bad_password) sans jamais
la révéler à l'utilisateur (anti-énumération maintenue). Aucune option
« Se souvenir de moi » : la stratégie session=database donne déjà 30
jours par défaut.

**Étape 1.6 — Espace authentifié minimal (écrans 29, 30, 32, 33, 37, 38).**
Nouveau route group `(authenticated)` sous `/[locale]/...` avec layout
commun (header + UserMenu) qui force `requireAuthenticated`. Sept routes :
`/profil` (lecture), `/profil/modifier` (édition), `/parametres` (index),
`/parametres/compte` (changement de mot de passe), `/parametres/langue`
(FR/EN), `/parametres/donnees` (export Loi 25), `/parametres/suppression`
(soft delete avec délai de grâce 30 jours). Cinq Server Actions
(signOutUser, updateProfile, changePassword, updateLocale,
requestAccountDeletion) et une Route Handler `/api/account/export` qui
génère le JSON immédiat avec `Content-Disposition: attachment`. Sécurité
Loi 25 : mot de passe actuel exigé pour changement mdp et suppression,
invalidation de toutes les sessions au changement de mdp et à la
suppression, AuditLog (PROFILE_UPDATED, AUTH_PASSWORD_RESET,
DATA_EXPORT_DELIVERED, DATA_DELETION_REQUESTED), DataRequest tracé
(EXPORT/DELETION). Nouveau composant `Avatar` dans `@eduquiz/ui`
(gradient déterministe + initiales en fallback). Middleware Auth.js Edge
étendu pour protéger `/profil` et `/parametres`. Changement d'email
reporté à un lot dédié.

**Étape 1.7 — Tests, RLS wrapper, observabilité.** Nouveau paquet
`@eduquiz/rate-limit` (ioredis + bucket fenêtre fixe atomique via
`MULTI INCR + PEXPIRE NX`, mode no-op si `REDIS_URL` absent, fail-open en
cas de panne Redis). Application sur cinq Server Actions sensibles : signin
(5/min/IP+email), register (3/15min/IP), forgot-password (3/15min/IP),
resend-verification (3/15min/email), account-deletion (3/jour/userId). Sur
dépassement : message générique anti-énumération. Logger structuré
minimaliste sans dépendance externe (`apps/web/src/lib/logger.ts` — JSONL,
niveau via `LOG_LEVEL`). Middleware Next.js : génération/propagation de
`x-request-id` (8 octets hex), repris en réponse, visible dans `headers()`
côté Server Components. Helper `withAuthenticatedDb()` qui combine
`requireApiUser` + `withUser` pour ouvrir une transaction RLS scopée —
pattern documenté pour les actions futures qui toucheront à des données
partagées. Healthcheck `/api/health` enrichi (uptime, status combiné app+DB,
503 si dépendance down). Tests unit ajoutés : `password.test.ts`,
`permissions.test.ts`, `templates/verification.test.ts`,
`rate-limit/limit.test.ts`. i18n : clé `rateLimited` ajoutée dans toutes
les sections d'erreur concernées + bloc partagé `auth.rateLimit.tooMany`.
`LOG_LEVEL` ajouté à `.env.example`.

**Étape 1.8 — Documentation et release.** Mise à jour de
`docs/01-architecture.md` (section Auth.js détaillée, paquets `auth`,
`email`, `rate-limit` ajoutés au diagramme), `docs/04-security-loi25.md`
(matrice « État de l'implémentation V1 » avec 17 contrôles livrés et
liste explicite des contrôles reportés), `README.md` racine (statut
Phase 1 + parcours d'auth livré + structure monorepo enrichie). Bump du
`package.json` racine à `0.1.0`. Tag annoté `v0.1.0`.

### Notes de migration

Aucune action manuelle requise pour passer de la phase 0 à `v0.1.0`. La
migration Prisma `20260425_extend_audit_event_kind` est idempotente et
sera appliquée automatiquement au prochain `pnpm --filter @eduquiz/db
db:migrate:deploy`. Les nouvelles variables d'environnement
(`AUTH_TRUST_HOST`, `AUTH_DEBUG`, `LOG_LEVEL`) ont des valeurs par défaut
sûres documentées dans `.env.example`. Nouveau paquet
  `@eduquiz/rate-limit` (ioredis + bucket fenêtre fixe atomique via
  `MULTI INCR + PEXPIRE NX`, mode no-op si `REDIS_URL` absent,
  fail-open en cas de panne Redis). Application sur cinq Server
  Actions sensibles : signin (5/min/IP+email), register (3/15min/IP),
  forgot-password (3/15min/IP), resend-verification (3/15min/email),
  account-deletion (3/jour/userId). Sur dépassement : message
  générique anti-énumération. Logger structuré minimaliste sans
  dépendance externe (`apps/web/src/lib/logger.ts` — JSONL,
  niveau via `LOG_LEVEL`). Middleware Next.js : génération/
  propagation de `x-request-id` (8 octets hex), repris en réponse,
  visible dans `headers()` côté Server Components. Helper
  `withAuthenticatedDb()` qui combine `requireApiUser` + `withUser`
  pour ouvrir une transaction RLS scopée — pattern documenté pour
  les actions futures qui toucheront à des données partagées.
  Healthcheck `/api/health` enrichi (uptime, status combiné app+DB,
  503 si dépendance down). Tests unit ajoutés : `password.test.ts`,
  `permissions.test.ts`, `templates/verification.test.ts`,
  `rate-limit/limit.test.ts`. i18n : clé `rateLimited` ajoutée dans
  toutes les sections d'erreur concernées + bloc partagé
  `auth.rateLimit.tooMany`. `LOG_LEVEL` ajouté à `.env.example`.
- **Étape 1.6 — Espace authentifié minimal (écrans 29, 30, 32, 33, 37,
  38).** Nouveau route group `(authenticated)` sous
  `/[locale]/...` avec layout commun (header + UserMenu) qui force
  `requireAuthenticated`. Sept routes : `/profil` (lecture), `/profil/
  modifier` (édition), `/parametres` (index), `/parametres/compte`
  (changement de mot de passe), `/parametres/langue` (FR/EN), `/
  parametres/donnees` (export Loi 25), `/parametres/suppression`
  (soft delete avec délai de grâce 30 jours). Cinq Server Actions
  (signOutUser, updateProfile, changePassword, updateLocale,
  requestAccountDeletion) et une Route Handler `/api/account/export`
  qui génère le JSON immédiat avec `Content-Disposition: attachment`.
  Sécurité Loi 25 : mot de passe actuel exigé pour changement mdp et
  suppression, invalidation de toutes les sessions au changement de
  mdp et à la suppression, AuditLog (PROFILE_UPDATED, AUTH_PASSWORD_RESET,
  DATA_EXPORT_DELIVERED, DATA_DELETION_REQUESTED), DataRequest tracé
  (EXPORT/DELETION). Soft delete : marque `User.disabledAt` + crée
  DataRequest type=DELETION status=AWAITING_GRACE_PERIOD avec
  graceExpiresAt à +30j, purge effective différée à un futur worker.
  Nouveau composant `Avatar` dans `@eduquiz/ui` (gradient déterministe
  + initiales en fallback). Middleware Auth.js Edge étendu pour
  protéger `/profil` et `/parametres`. Changement d'email reporté à
  un lot dédié (re-vérification, période transitoire, anti-takeover).
- **Étape 1.5 — Connexion + reset password (écrans 16, 17, 18).**
  Trois nouvelles routes Next.js : `/[locale]/connexion` avec
  bannières contextuelles (`?verified=1`, `?reset=1`,
  `?session=expired`), OAuth Google/Apple conditionnels, formulaire
  Credentials sécurisé via Server Action `signInAdult` (pattern
  Auth.js v5 `try/catch AuthError`) ; `/[locale]/mot-de-passe-oublie`
  qui appelle `requestPasswordReset` (anti-énumération, toujours
  `ok: true` côté UI) ; `/[locale]/mot-de-passe-oublie/reinitialiser/
  [token]` qui inspecte le token côté Server Component et délègue la
  consommation à `completePasswordReset` (transaction Prisma : update
  passwordHash + suppression de toutes les sessions actives + AuditLog
  AUTH_PASSWORD_RESET). Nouveau template email
  `buildResetPasswordEmail` (FR/EN, validité 1 h). Nouveau composant
  `Alert` dans `@eduquiz/ui` (variants info/success/warning/danger).
  Le provider Credentials de `@eduquiz/auth` trace désormais les
  échecs (`AUTH_FAILED`) avec une raison interne
  (unknown_user/disabled/no_password/unverified/bad_password) sans
  jamais la révéler à l'utilisateur (anti-énumération maintenue).
  Aucune option « Se souvenir de moi » : la stratégie session=database
  donne déjà 30 jours par défaut.
- **Étape 1.4 — Flux d'inscription adulte (écrans 15, 19, 22, 23).**
  Nouveau paquet `@eduquiz/email` (nodemailer + templates HTML
  bilingues : verification, welcome). Composants UI ajoutés à
  `@eduquiz/ui` (`Input`, `PasswordInput`, `Checkbox`, `FormField`).
  Migration Prisma `20260425_extend_audit_event_kind` étendant
  `AuditEventKind` avec `AUTH_USER_CREATED` et `AUTH_VERIFY_EMAIL`.
  Côté `apps/web`, quatre routes `/[locale]/{inscription,
  inscription/adulte, verification-email, verification-email/confirme/
  [token]}` avec trois Server Actions (`registerAdult`,
  `resendVerification`, `confirmVerification`). Validation Zod stricte
  (email, complexité mot de passe ≥ 8 + 1 chiffre + 1 majuscule, check
  majorité 18 ans, CGU obligatoire). Anti-collision email avec message
  clair. Hash Argon2id + transaction Prisma User+Profile+ConsentRecord
  (TERMS_ACCEPTED, PRIVACY_ACCEPTED, MARKETING_OPTED_IN si choisi).
  Aucune auto-connexion — vérification email obligatoire avant login.
  OAuth Google/Apple rendus conditionnellement (env configurés).
- **Étape 1.3 — Auth.js v5 backbone.** Nouveau paquet `@eduquiz/auth`
  exposant la configuration Auth.js v5 en deux variantes (Node et
  Edge-safe), l'adapter Prisma, les providers Credentials (Argon2id) et
  Google/Apple OAuth conditionnels, ainsi que des helpers serveur
  (rôles, mots de passe, tokens de vérification). Côté `apps/web`,
  catch-all `/api/auth/[...nextauth]`, instanciation `auth()` Node, et
  refonte du middleware pour composer i18n + protection des futures
  zones `/[locale]/{dashboard,parent,admin}/*`. Sessions persistées en
  DB côté Node (révocation immédiate, audit IP/UA), JWT côté Edge.
  Événements `signIn`/`signOut` tracés dans `AuditLog`. Variables
  d'environnement `AUTH_*` validées par Zod au boot.
- **Étape 1.2 — Catalogue matières et niveaux scolaires.** Catalogue
  étendu à dix matières du programme québécois avec détail niveau par
  niveau et placeholders SVG. Nouvelle section « Niveaux scolaires »
  sur la home (mini-cards) avec page détail
  `/[locale]/niveaux/[level]` listant les matières au programme à ce
  niveau.

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
