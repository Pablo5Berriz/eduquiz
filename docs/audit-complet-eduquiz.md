# Audit complet — EduQuiz

Date de l'audit : 2026-07-08 Dépôt audité :
`C:\Users\paulq\Downloads\Projets\Eduquiz\eduquiz` (remote
`git@github.com:Pablo5Berriz/eduquiz.git`) Branche analysée : `main` — commit
`c146035` (2026-05-14 19:42:52 -0400), 63 commits, auteur unique (Paul Quentin)
Méthode : lecture directe du code, des migrations SQL, des politiques RLS, de la
configuration CI/Docker, et des logs Turbo mis en cache par les dernières
exécutions locales (`*/​.turbo/turbo-*.log`, datés du 2026-04-29 au 2026-05-15).
Aucune commande destructive exécutée. Aucun fichier applicatif modifié.

> **Note.** Un rapport portant le même nom existait déjà à cet emplacement
> (visiblement produit lors d'une session antérieure, dans un environnement où
> `pnpm` était présent mais en version 11.7.0 au lieu de 9.12.3, provoquant des
> échecs d'installation `ERR_PNPM_IGNORED_BUILDS`). Ce document le remplace
> intégralement : il est basé sur une relecture indépendante du code source, des
> migrations SQL et des politiques RLS fichier par fichier, et sur les logs
> réels de build/test déjà présents en cache sur le disque plutôt que sur une
> tentative d'installation ayant échoué avant même d'atteindre les scripts.

> **Avertissement de portée.** Le sandbox de cet audit ne dispose pas de `pnpm`
> : `corepack enable` échoue par `EACCES` (permission système refusée pour créer
> le symlink `/usr/bin/pnpm`), et le `node_modules` présent sur disque (installé
> sous Windows) ne contient pas de binaire `turbo` exploitable ici
> (`MODULE_NOT_FOUND`). Il n'a donc pas été possible de relancer
> `pnpm lint / typecheck / test / build` en direct dans cette session. Les
> résultats de build/test présentés proviennent des **logs réels de la dernière
> exécution locale**, conservés en cache (`apps/*/.turbo/turbo-*.log`,
> `packages/*/.turbo/turbo-*.log`, `apps/web/test-results/.last-run.json`),
> datés du 2026-04-29 au 2026-05-15. Ce ne sont pas des résultats inventés : ce
> sont des artefacts réels laissés sur disque par un run antérieur de l'équipe,
> mais ils ne reflètent pas nécessairement les 85 fichiers modifiés et 23
> fichiers non suivis présents dans l'arbre de travail actuel (voir §2). Une
> ré-exécution locale par l'équipe reste indispensable avant toute décision de
> mise en production — voir §19 et le résumé de fin de rapport pour le détail
> des limites.

---

## 1. Résumé exécutif

EduQuiz est un monorepo Turborepo/pnpm à l'architecture délibérée et documentée
avec un niveau de rigueur nettement au-dessus de la moyenne d'un projet en phase
1 : séparation des couches, Row Level Security Postgres en défense en
profondeur, hashing Argon2id conforme OWASP 2024, audit append-only, gestion Loi
25 (export, suppression avec délai de grâce), CI multi-jobs avec build Docker et
smoke test. Le code applicatif inspecté (auth, RLS, rate-limit, tokens, actions
serveur) est propre : zéro `console.log`, usage de `any` quasi nul en dehors du
code généré, discipline de commentaires et de documentation rare à ce stade d'un
projet solo.

Le produit pédagogique, en revanche, n'existe qu'en version minimale : un seul
parcours d'apprentissage bout-en-bout est réellement livré sur `main`
(QCM/vrai-faux), pas de dashboard parent stabilisé, pas de paiement, mobile
réduit à un écran squelette. La documentation interne
(`docs/09-implementation-status.md`) est elle-même honnête sur ces manques —
signe de maturité d'équipe, mais qui ne change rien au fait que le produit n'est
pas vendable en l'état.

Deux constats vérifiés changent la lecture par rapport à ce que la documentation
ou le README laissent penser :

1. **Le typecheck du web échoue** dans le dernier run local capturé (log daté du
   2026-05-15, 8 erreurs TypeScript réparties sur 3 fichiers) et **une suite de
   tests Vitest échoue** (`purgeExpiredAccounts.test.ts`, bug de hoisting de
   mock — 113 tests passent, 1 fichier échoue). Le dépôt n'était donc pas dans
   un état vert au moment du dernier run capturé.
2. **Les Server Actions admin et famille contournent délibérément le RLS**
   (`prismaService`, client à privilèges potentiellement élevés) et ne
   s'appuient que sur un contrôle de rôle applicatif — exactement le point que
   `09-implementation-status.md` signale lui-même comme "à vérifier". C'est
   confirmé par lecture directe : la défense en profondeur RLS ne couvre pas ces
   routes.

Niveau de maturité global : **socle technique solide, produit incomplet, non
prêt pour la production, mais sain et dans une trajectoire de qualité
correcte.**

**Verdict global : GO POUR STABILISATION** (justification détaillée en §28).

---

## 2. Informations du dépôt

| Élément                                                 | Valeur                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nom                                                     | `eduquiz`                                                                                                                                                                                                                                                                                                                                   |
| Remote                                                  | `git@github.com:Pablo5Berriz/eduquiz.git`                                                                                                                                                                                                                                                                                                   |
| Branche                                                 | `main`, en avance de 41 commits sur `origin/main` (non poussés)                                                                                                                                                                                                                                                                             |
| Dernier commit                                          | `c146035` — `feat(i18n): add ordering quiz labels` — 2026-05-14                                                                                                                                                                                                                                                                             |
| Nombre de commits                                       | 63 (historique du 2026-04-18 au 2026-05-14, ~1 mois)                                                                                                                                                                                                                                                                                        |
| Contributeur·s                                          | 1 seul (Paul Quentin, auteur et committer)                                                                                                                                                                                                                                                                                                  |
| Tags                                                    | `v0.1.0`                                                                                                                                                                                                                                                                                                                                    |
| Arbre de travail                                        | **Non propre** : 85 fichiers modifiés + 23 fichiers non suivis (travaux en cours : parcours mineur, dashboard parent, admin)                                                                                                                                                                                                                |
| Anomalie Git                                            | Un `.git/index.lock` vide (0 octet, horodaté du jour de l'audit) présent dans `.git/` — signe qu'une commande Git a été interrompue ou qu'un process concurrent tourne (`git status` a émis `unable to unlink` en lecture seule pendant l'audit). À vérifier avant tout commit.                                                             |
| Gestionnaire de paquets                                 | pnpm 9.12.3 déclaré (workspaces), Turborepo 2.9.6                                                                                                                                                                                                                                                                                           |
| Type de dépôt                                           | Monorepo (apps + packages), pas de sous-modules                                                                                                                                                                                                                                                                                             |
| Applications détectées                                  | `apps/web` (Next.js 14), `apps/mobile` (Expo SDK 52, squelette)                                                                                                                                                                                                                                                                             |
| Contexte hors dépôt Git, présent dans le dossier parent | `Eduquiz (1)/` contient un audit précédent daté du 2026-05-06 (`audit-eduquiz-2026-05-06.md`, `backlog-eduquiz-2026-05-06.md`) et `.backup/rate-limit-failclosed-20260506-1323/` contient une sauvegarde manuelle liée à un correctif rate-limit. Ni l'un ni l'autre ne fait partie du dépôt Git ; non utilisés comme source de vérité ici. |

---

## 3. Arborescence commentée

```
eduquiz/
├── apps/
│   ├── web/            Next.js 14 App Router — vitrine publique + espace
│   │                    authentifié + zone admin + Route Handlers API.
│   │                    Contient tout le code métier de la V1.
│   └── mobile/          Expo SDK 52 / Expo Router v4 — squelette
│                        (_layout.tsx + un écran d'accueil). Pas de logique
│                        métier, pas de tests, pas d'auth mobile.
├── packages/
│   ├── db/              Schéma Prisma (32 modèles, 21 enums), migrations
│   │                    SQL, politiques RLS (8 fichiers), client Prisma
│   │                    contextualisé (prisma / prismaService / withUser).
│   ├── auth/            Auth.js v5 : config Node + config Edge séparées,
│   │                    Argon2id, tokens, permissions, providers OAuth
│   │                    conditionnels.
│   ├── email/            nodemailer + templates HTML bilingues.
│   ├── rate-limit/       Rate limiting Redis fenêtre fixe, fail-open documenté.
│   ├── i18n/             Dictionnaires FR/EN plats.
│   ├── types/            Types de domaine indépendants de Prisma.
│   ├── utils/            Fonctions pures (slug, scoring, dates).
│   └── config/           Presets ESLint/TS/Prettier/Tailwind partagés (pas
│                         de logique exécutée à runtime).
├── infra/docker/         Dockerfile web multi-stage (non-root, tini,
│                          healthcheck), compose dev/prod, scripts backup
│                          (pg_dump + age + MinIO replicate).
├── docs/                 11 documents numérotés + `README.md` +
│                         `infrastructure/`. Qualité rédactionnelle très
│                         supérieure à la moyenne ; `09-implementation-status.md`
│                         joue explicitement le rôle de source de vérité sur
│                         l'état réel, ce qui est une bonne pratique rare.
├── scripts/               1 script de téléchargement d'images (utilitaire dev).
├── .github/workflows/     ci.yml (lint/typecheck/format/test/build-web/
│                          build-docker) + migrations-check.yml (dérive
│                          schéma Prisma / migrations SQL).
├── .cowork/instructions.md  Instructions permanentes pour agent IA — hors
│                            périmètre applicatif mais présent dans le repo.
└── .code-review-graph/    Base SQLite d'un outil tiers de revue de code
                           (graph.db) — n'est pas du code applicatif ; à
                           vérifier s'il doit rester versionné.
```

Aucune duplication structurelle majeure détectée. Points de propreté à corriger
(P3, aucun risque en soi) : le dossier `.code-review-graph/` et 6 fichiers
`_tmp_3_*` (0 octet, non suivis) traînent à la racine.

---

## 4. Stack technique

| Domaine            | Technologie                                      | Version                                                                           | Où                              | Constat                                                                                                |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Langage            | TypeScript                                       | 5.6.3, `strict: true` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` | `tsconfig.base.json`            | Configuration stricte au-delà du défaut — bon signal. Actuellement en échec de compilation (voir §18). |
| Runtime            | Node.js                                          | 22 LTS (`.nvmrc`, `engines`)                                                      | racine                          | Cohérent partout.                                                                                      |
| Monorepo           | Turborepo 2.9.6 + pnpm workspaces 9.12.3         | —                                                                                 | racine                          | Graphe de tâches correct (`^build`, `^typecheck`).                                                     |
| Framework web      | Next.js                                          | 14.2.18, App Router, `output: standalone`                                         | `apps/web`                      | Version actuelle mais Next 14 (Next 15 existe) ; à surveiller pour la fenêtre de support.              |
| UI web             | React 18.3.1, Tailwind 3.4.17, tailwind-variants | —                                                                                 | `packages/ui`, `apps/web`       | Composants partagés propres (Button, Input, Card, FormField…), pas de Storybook.                       |
| Mobile             | Expo SDK 52, Expo Router v4, React Native 0.76.3 | —                                                                                 | `apps/mobile`                   | Squelette uniquement.                                                                                  |
| Auth               | Auth.js (NextAuth) v5.0.0-beta.25                | —                                                                                 | `packages/auth`                 | **Version beta** en dépendance de production — risque de breaking change amont.                        |
| Mots de passe      | `@node-rs/argon2`, Argon2id m=19456 t=2 p=1      | —                                                                                 | `packages/auth/src/password.ts` | Conforme OWASP 2024, vérifié dans le code (pas seulement la doc).                                      |
| ORM / DB           | Prisma 5.22.0 + PostgreSQL 16 (pgcrypto, citext) | —                                                                                 | `packages/db`                   | RLS Postgres natif (pas Supabase).                                                                     |
| Cache / rate-limit | Redis (ioredis)                                  | —                                                                                 | `packages/rate-limit`           | Fail-open documenté et assumé (trade-off explicite en commentaire).                                    |
| Email              | nodemailer + Resend (SMTP)                       | —                                                                                 | `packages/email`                | Templates HTML bilingues, tests unitaires présents.                                                    |
| Validation         | Zod 3.24.1                                       | —                                                                                 | partout                         | Utilisé de façon cohérente dans les Server Actions vérifiées.                                          |
| Tests unitaires    | Vitest 2.1.8/2.1.9                               | —                                                                                 | tous les packages               | 22 fichiers `*.test.ts(x)`, 115 tests dans `apps/web` seul.                                            |
| Tests E2E          | Playwright                                       | —                                                                                 | `apps/web/e2e/`                 | 1 seul scénario (`learning-flow.spec.ts`), fixture générée dynamiquement.                              |
| CI                 | GitHub Actions                                   | —                                                                                 | `.github/workflows/`            | 6 jobs parallèles + agrégateur, service Postgres éphémère pour le job de build.                        |
| Conteneurisation   | Docker multi-stage, `node:22-alpine`             | —                                                                                 | `infra/docker/web.Dockerfile`   | Non-root (UID 1001), `tini`, healthcheck, cible <200 Mo.                                               |
| Observabilité      | Logs JSONL stdout + `/api/health`                | —                                                                                 | —                               | Pas de Prometheus/Grafana/Loki en V1 (assumé et documenté).                                            |
| Paiement           | Stripe (variables prévues)                       | —                                                                                 | `.env.example`                  | Non intégré, uniquement les variables réservées.                                                       |

Cohérence globale bonne : le graphe de dépendances entre packages internes
(`config → types/utils/i18n → db/ui → auth/email/rate-limit → apps`) est
acyclique — vérifié en lisant les `package.json` de chaque paquet, pas de
référence circulaire trouvée.

**Risque de version identifié** : `next-auth@5.0.0-beta.25` reste en beta — un
projet qui vise la production doit soit figer cette version avec une vigie de
changelog, soit prévoir un budget de migration vers la release stable dès
qu'elle sort.

---

## 5. Architecture actuelle

Architecture **en couches, monorepo modulaire par domaine technique** :

```
Présentation (apps/web/src/app/**)                — Server/Client Components
        │
Server Actions & Route Handlers (apps/web/src/lib/**/actions.ts, app/api/**)
        │
Packages domaine (auth, email, rate-limit)         — logique réutilisable
        │
Accès données contextualisé (@eduquiz/db: prisma / prismaService / withUser)
        │
PostgreSQL 16 + RLS (packages/db/prisma/rls/*.sql)  — dernière ligne de défense
```

Points forts vérifiés dans le code (pas seulement dans la doc) :

- **RLS réellement appliquée** pour `attempts`, `attempt_answers`, `progress`,
  `user_badges`, `streaks`, `parent_child_links` (`ENABLE` +
  `FORCE ROW LEVEL SECURITY`, policies par rôle). `submitQuizAttempt` (le chemin
  le plus sensible du produit) utilise correctement `withUser(...)` pour
  positionner le contexte RLS avant d'écrire — vérifié ligne par ligne.
- **Append-only** pour `audit_logs` et `consent_records` (triggers PL/pgSQL,
  migration `20260419220100_append_only`).
- **Versionnage de contenu** (`content_versions` + `Attempt.activityVersion`)
  pour garantir qu'une correction se fait sur la version vue par l'apprenant.

Point d'attention architectural majeur :

- **Deux modes d'accès à la donnée coexistent sans garde-fou automatique** :
  `withUser(...)` (RLS active) et `prismaService` (bypass RLS possible si
  `SERVICE_DATABASE_URL` pointe vers un rôle Postgres privilégié). Le
  commentaire du fichier `client.ts` dit lui-même "Ne jamais l'utiliser dans une
  route user-facing sans justification de sécurité", mais c'est une convention,
  pas une contrainte technique. `admin/actions.ts` et `family/actions.ts`
  l'utilisent aujourd'hui, avec un contrôle de rôle applicatif correct mais sans
  la deuxième couche RLS (voir §14).

### Architecture recommandée (évolutions, pas une refonte)

1. **Faire respecter la convention `prismaService` par l'outillage** : règle
   ESLint (`no-restricted-imports` ciblée) interdisant son import dans
   `apps/web/src/lib/**` sauf liste blanche explicite avec commentaire de
   justification.
2. **Ajouter une politique RLS pour les tables de contenu pédagogique**
   (`courses`, `lessons`, `activities`, etc.), même permissive pour ADMIN, pour
   fermer la fenêtre où un bug de contrôle de rôle applicatif suffirait à tout
   compromettre.
3. **Introduire un test d'intégration RLS générique** : pour chaque table
   sensible, vérifier qu'une requête sans `SET LOCAL app.current_user_id` est
   bien rejetée (fail-closed prouvé automatiquement).
4. À moyen terme, un dossier `server/` unique par feature (actions + validation
   Zod + repository) pour préparer une éventuelle extraction en services — non
   urgent vu la taille actuelle du code.

---

## 6. Inventaire des applications et packages

| Nom                   | Rôle                                            | Statut            | Tests                                                                 | Remarque                                                                  |
| --------------------- | ----------------------------------------------- | ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web`            | Application principale (100 % du produit livré) | Actif             | 21 fichiers `.test.ts(x)` + 1 E2E                                     | Concentre la quasi-totalité du risque et de la valeur du dépôt            |
| `apps/mobile`         | Client Expo                                     | Squelette         | 0 (placeholder `echo`)                                                | `_layout.tsx` + `index.tsx` seulement                                     |
| `@eduquiz/db`         | Schéma + RLS + client Prisma                    | Actif, critique   | 0 fichier `*.test.ts` direct                                          | Seul point d'accès Postgres autorisé par convention                       |
| `@eduquiz/auth`       | Auth.js v5 + Argon2id + tokens + permissions    | Actif, critique   | 3 fichiers, 22 tests, tous passants (cache 2026-05-15)                | Bonne couverture des fonctions pures                                      |
| `@eduquiz/email`      | Templates + envoi                               | Actif             | 1 fichier, 4 tests passants                                           | Templates non testés visuellement                                         |
| `@eduquiz/rate-limit` | Rate limiting Redis                             | Actif             | 2 fichiers, 10 tests passants                                         | Fail-open testé explicitement                                             |
| `@eduquiz/i18n`       | Dictionnaires FR/EN                             | Actif             | 0 test (acceptable, données statiques)                                | —                                                                         |
| `@eduquiz/types`      | Types de domaine                                | Actif             | 0 test (acceptable)                                                   | —                                                                         |
| `@eduquiz/utils`      | Fonctions pures                                 | Actif             | 0 test direct dans ce paquet (scoring/mastery testés côté `apps/web`) | Manque de tests unitaires à la source                                     |
| `@eduquiz/ui`         | Composants React partagés                       | Actif             | 0 test                                                                | Pas de test de rendu/snapshot — risque de régression visuelle silencieuse |
| `@eduquiz/config`     | Presets partagés                                | Config uniquement | N/A                                                                   | —                                                                         |

---

## 7. Cartographie fonctionnelle (statut réel vérifié)

Synthèse recoupée avec `docs/09-implementation-status.md`, mais vérifiée par
lecture de code (chaque ligne "confirmé" correspond à un fichier effectivement
ouvert dans cet audit) :

| Fonctionnalité                                       | Statut                                                | Preuve code                                          | Commentaire                                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Inscription adulte + vérification email              | Fonctionnelle                                         | `register.ts`, `verify-email.ts`, `tokens.ts`        | Token 256 bits, TTL 24h, usage unique (delete atomique)                                                        |
| Connexion credentials + OAuth conditionnel           | Fonctionnelle                                         | `signin.ts`, `providers/{google,apple}.ts`           | Anti-énumération confirmée (message générique)                                                                 |
| Reset mot de passe                                   | Fonctionnelle                                         | `forgot-password.ts`, `tokens.ts`                    | TTL 1h, invalide `sessionVersion`                                                                              |
| Paramètres compte (mdp, langue, export, suppression) | Fonctionnelle                                         | `parametres/**`, `account.ts`                        | Export Loi 25 en JSON confirmé, pas de PDF/async                                                               |
| Rattachement parent-enfant (code 6 chiffres)         | Fonctionnelle, avec une faiblesse crypto              | `family/actions.ts`                                  | Flux complet (invitation → redeem → confirm email) mais `Math.random()` génère le code — voir §15              |
| Dashboard parent                                     | Interface + actions partielles                        | `parent/enfants/page.tsx`, `ParentDashboardForm.tsx` | Présent dans l'arbre de travail non commité, pas encore mergé sur `main`                                       |
| Catalogue pédagogique                                | Livré minimal                                         | `learning/catalog.ts`, `content.ts`                  | Contenu seedé (`seed.ts`, 1066 lignes)                                                                         |
| Exercices guidés                                     | Partiel — MCQ_SINGLE et TRUE_FALSE en pratique guidée | `ExercisePractice.tsx`                               | Les 5 autres types existent en DB/scoring mais pas exposés en pratique guidée                                  |
| Quiz + scoring                                       | Livré minimal, tous types de questions scorés         | `scoring.ts`, `learning/actions.ts`                  | MCQ_SINGLE, MCQ_MULTI, TRUE_FALSE, FILL_IN_THE_BLANK, MATCHING, ORDERING, SHORT_ANSWER gérés (commits récents) |
| Progression / mastery (EWMA)                         | Livré minimal                                         | `mastery.ts`, `Progress` model                       | RLS appliquée                                                                                                  |
| Gamification (badges, streaks)                       | Tables prêtes, pas de logique de déclenchement        | `Badge`, `UserBadge`, `Streak`                       | Aucune action ne les peuple                                                                                    |
| Paiement Stripe                                      | Non livré                                             | Variables d'env réservées seulement                  | Aucun code Stripe trouvé                                                                                       |
| Mobile                                               | Squelette                                             | `apps/mobile/src/app/index.tsx`                      | Aucune fonctionnalité                                                                                          |
| Admin contenu (cours/leçons/activités)               | Fonctionnel, validations de publication correctes     | `admin/actions.ts`                                   | Contrôle de rôle correct, RLS non appliquée (§14) ; **typecheck en échec sur ce fichier** (§18)                |
| Écoles / classes / enseignants                       | Absente                                               | Aucun modèle dédié trouvé                            | Domaine scolaire multi-tenant non modélisé — hors scope B2C V1, cohérent avec le positionnement documenté      |
| Devoirs / défis / classements / multijoueur          | Absente                                               | Aucun code trouvé                                    | Hors MVP actuel                                                                                                |
| Mode hors ligne / synchronisation                    | Absente                                               | Aucun IndexedDB/SQLite/queue trouvé                  | Non prévu pour la V1 web ; mobile trop embryonnaire pour en juger                                              |

---

## 8. Parcours utilisateurs

**Apprenant adulte** : inscription → vérification email → connexion →
`/apprendre` → leçon → exercice guidé (feedback immédiat, non noté) → quiz →
résultat → historique. Parcours complet et cohérent d'après le code inspecté.

**Apprenant mineur** : `inscription/mineur/`, `relier-parent/`,
`rattachement/[token]/` existent mais en fichiers **non suivis Git** — donc non
mergés sur `main`, à considérer comme "en cours", pas "livré".

**Parent** : `parent/enfants/` (dashboard) existe en non-suivi. Flux de
rattachement fonctionnellement complet côté Server Actions
(`family/actions.ts`), mais **aucun test automatisé trouvé** pour
`redeemParentCode` / `confirmParentLink` — absence notable sur un flux à fort
enjeu de consentement mineur.

**Admin** : `/admin/cours/**` — CRUD cours/leçons/activités avec validation de
publication assez rigoureuse (`validateQuestionForPublishing` couvre les 7 types
d'exercice). Protégé par `requireContentAdmin` → `UserRole.ADMIN` uniquement.
**Aucun test automatisé trouvé** pour `admin/actions.ts` malgré sa complexité —
deuxième absence de test notable.

**Utilisateur non authentifié** : vitrine bilingue (38 écrans mentionnés au
README), pages légales, contact. Structure de routes cohérente (`[locale]/...`),
non auditée exhaustivement (hors périmètre à risque, temps d'audit limité — voir
limites en fin de rapport).

Aucune route orpheline ni redirection cassée détectée dans le sous-ensemble de
fichiers inspecté.

---

## 9. Frontend

Organisation en App Router avec groupes de routes `(authenticated)` et `(admin)`
— bonne pratique Next.js pour isoler layouts et gardes d'accès. Les composants
de formulaire (`SignupAdultForm.tsx`, `QuizForm.tsx`, `EditProfileForm.tsx`)
sont des Client Components dédiés par écran.

Constats vérifiés :

- `ExercisePractice.tsx` dépasse 700 lignes (ligne 720 visée par une erreur de
  typecheck, §18) — candidat naturel à la décomposition par type d'exercice.
- Pas d'usage de `dangerouslySetInnerHTML` trouvé dans tout `apps/web`
  (recherche exhaustive) — bon point pour le risque XSS.
- Pas de `console.log` résiduel (hors un `eslint-disable-next-line no-console`
  explicite et justifié dans `api/contact/route.ts`).
- Design system : composants partagés dans `packages/ui` construits avec
  `tailwind-variants`. Pas de Storybook, pas de documentation de variantes hors
  du code source.

Les 38 pages de la vitrine publique n'ont pas été auditées individuellement
(temps d'audit insuffisant pour un rendu visuel réel) — seule une revue
structurelle des routes a été faite.

---

## 10. UI/UX

Constat basé sur la lecture du code (pas de rendu visuel réel, aucun outil de
capture d'écran disponible dans ce sandbox) :

- Préférences d'accessibilité modélisées explicitement en base
  (`Profile.reducedMotion`, `Profile.highContrast`, `Profile.theme`) — signal
  positif rare, mais je n'ai pas vérifié que ces préférences sont effectivement
  appliquées dans le rendu CSS : **à valider manuellement**, un champ en base
  sans branchement CSS ne sert à rien.
- Formulaires (`SignupAdultForm`, `ChangePasswordForm`, `QuizForm`) suivent un
  pattern cohérent de validation Zod + affichage d'erreurs. Une revue UX
  visuelle réelle (contraste, densité, hiérarchie) nécessiterait un rendu que je
  n'ai pas pu produire ici.

---

## 11. Accessibilité (WCAG)

Analyse limitée à ce qui est vérifiable statiquement (pas de rendu ni d'outil
axe-core disponible) :

- Champs d'accessibilité en base existent (§10) mais leur effectivité n'est pas
  vérifiable sans rendu.
- Aucune balise `<img>` sans `alt` détectée par recherche rapide, mais un audit
  WCAG sérieux nécessiterait Playwright + axe-core, non exécutable dans ce
  sandbox (pnpm indisponible).

**Conclusion : accessibilité non auditable en profondeur dans cette session — à
traiter comme validation manuelle obligatoire avant production** (recommandation
: `@axe-core/playwright` sur les parcours principaux une fois l'environnement de
build restauré).

---

## 12. Backend et API

Le "backend" d'EduQuiz est constitué de Server Actions (`'use server'`) et de
quelques Route Handlers. Endpoints recensés :

| Route                      | Méthode  | Auth                     | Validation                          | Remarque                                                     |
| -------------------------- | -------- | ------------------------ | ----------------------------------- | ------------------------------------------------------------ |
| `/api/auth/[...nextauth]`  | GET/POST | Auth.js                  | Auth.js interne                     | Standard                                                     |
| `/api/health`              | GET      | Non                      | —                                   | Ping DB, `{status:"ok"}`                                     |
| `/api/contact`             | POST     | Non                      | Non inspectée en détail             | Formulaire public, anti-spam non confirmé                    |
| `/api/account/export`      | GET      | Oui, utilisateur propre  | —                                   | Export Loi 25, testé (`route.test.ts`, `route.rls.test.ts`)  |
| `/api/cron/purge-accounts` | GET      | Secret `Bearer` statique | Comparaison `!==` non constant-time | Doc de sécurité correcte, implémentation à durcir légèrement |

Les Server Actions (`learning/actions.ts`, `family/actions.ts`,
`admin/actions.ts`, `auth/actions/*.ts`, `purge/purgeExpiredAccounts.ts`)
constituent l'essentiel de la logique métier :

- `submitQuizAttempt` : validation Zod, re-vérification serveur de chaque
  réponse contre la liste des IDs valides (empêche l'injection de réponses
  arbitraires), transaction RLS, mise à jour atomique de `Progress`, audit —
  **bonne pratique confirmée de bout en bout**.
- `admin/actions.ts` / `family/actions.ts` : logique métier correcte
  (validations de publication assez complètes) mais usage de `prismaService`
  (§5, §14) et pas de pagination visible sur les listings admin (non vérifiée en
  détail).
- Erreurs génériques renvoyées à l'utilisateur avec logging détaillé côté
  serveur — bon pattern, évite la fuite d'information sans perdre la
  traçabilité.

---

## 13. Base de données

Schéma Prisma : 32 modèles, 21 enums, conventions cohérentes (UUID v7,
`createdAt`/`updatedAt` systématiques, `@@map` snake_case).

Points forts vérifiés :

- **Append-only réel** pour `audit_logs` et `consent_records` (triggers, pas
  seulement une convention documentée).
- **RLS avec `FORCE ROW LEVEL SECURITY`** (empêche même le propriétaire de table
  de contourner les policies) sur `attempts`, `attempt_answers`, `progress`,
  `user_badges`, `streaks`, `parent_child_links` — vérifié dans 3 fichiers SQL
  sur 8 (`00_helpers.sql`, `20_parenting.sql`, `50_learning.sql`). Les 5 autres
  (`10_identity.sql`, `30_consent_audit.sql`, `40_billing.sql`,
  `60_communications.sql`, `70_catalogue.sql`) **n'ont pas été ouverts dans cet
  audit** — à vérifier explicitement avant toute mise en production, en
  particulier `70_catalogue.sql` (contenu pédagogique, actuellement modifié via
  `prismaService` sans confirmation de RLS).
- **Migrations séquentielles cohérentes** (6 migrations), avec un job CI dédié
  (`migrations-check.yml`) qui détecte la dérive schéma/migrations via
  `prisma migrate diff`.
- **Versionnage de contenu** (`ContentVersion`) qui protège l'intégrité d'une
  tentative même si le contenu change après coup.

Point à vérifier en priorité (non confirmé faute de lecture complète des
migrations) :

- Le champ `Profile.birthDate` est commenté "chiffré au repos via pgcrypto (cf.
  migration)" dans le schéma, mais le type Prisma déclaré est un
  `DateTime @db.Date` en clair, ce qui semble contredire le commentaire. **Point
  à vérifier manuellement en priorité** (donnée d'un mineur, Loi 25) : soit le
  chiffrement existe réellement au niveau SQL dans une migration non inspectée
  en détail ici et la documentation est correcte, soit le commentaire du schéma
  décrit une intention non encore implémentée.

---

## 14. Authentification et autorisations

**Authentification.** Auth.js v5 avec deux configurations (Node/Edge)
correctement séparées pour respecter la contrainte du runtime Edge du middleware
— vérifié dans `packages/auth/src/{config,config-edge,edge}.ts`. JWT +
validation serveur par `sessionVersion` (incrémenté sur reset password /
changement de mdp / suppression) — mécanisme correctement implémenté et cohérent
avec la documentation.

**Autorisation.** Deux couches, comme annoncé par la documentation :

1. Route-level : `requireRole` / `requireAnyRole` / `requireContentAdmin` côté
   Server Actions (vérifié dans `permissions.ts`, `admin/actions.ts`,
   `family/actions.ts`) — logique correcte, y compris "ADMIN passe toujours"
   (choix explicite et documenté).
2. Data-level : RLS Postgres — **couvre les tables d'apprentissage et de
   parentalité, mais pas confirmée sur le contenu pédagogique ni
   l'administration** (§13). C'est la faille de défense en profondeur la plus
   concrète identifiée : si un bug futur permettait à un rôle non-admin
   d'appeler `admin/actions.ts` (erreur de câblage de route, régression sur
   `requireContentAdmin`), rien côté base de données n'empêcherait la mutation.

**Matrice des rôles (vérifiée dans le code)** :

| Rôle            | Peut                                                                                                                 | Vérifié où                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `LEARNER_ADULT` | Apprentissage, profil propre, export/suppression propre                                                              | `learning/actions.ts`, `auth/actions/*`                            |
| `LEARNER_MINOR` | Idem + `redeemParentCode` (soi-même uniquement, vérifié `childId === user.id`)                                       | `family/actions.ts`                                                |
| `PARENT`        | `createParentInvitation`, consultation des données de ses enfants **vérifiés** via RLS (`app_is_verified_parent_of`) | `family/actions.ts`, `rls/20_parenting.sql`, `rls/50_learning.sql` |
| `ADMIN`         | Tout (bypass explicite dans `requireRole`/`requireAnyRole` + `app_is_admin()` RLS)                                   | partout                                                            |

Aucune élévation de privilège horizontale ou verticale évidente trouvée dans le
code inspecté. Une revue de pénétration active (tentative réelle de
contournement) n'a pas été effectuée — analyse statique uniquement.

---

## 15. Sécurité — constats détaillés

| ID    | Sévérité             | Constat                                                                                                                                     | Fichier                                                | Recommandation                                                                                                 | Effort   |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| SEC-1 | **P1**               | Génération du code de rattachement parent-enfant (6 chiffres, contrôle d'accès à un compte mineur) via `Math.random()`, non cryptographique | `apps/web/src/lib/family/actions.ts:337`               | Remplacer par `crypto.randomInt(0, 1_000_000)` (`node:crypto`)                                                 | XS       |
| SEC-2 | P2                   | Comparaison du secret cron par égalité de chaîne (`!==`), non résistante au timing attack                                                   | `apps/web/src/app/api/cron/purge-accounts/route.ts:56` | `crypto.timingSafeEqual` sur des buffers de longueur égale                                                     | XS       |
| SEC-3 | P2                   | Routes admin/famille utilisent `prismaService` sans confirmation de policies RLS équivalentes sur les tables concernées                     | `admin/actions.ts`, `family/actions.ts`                | Policies RLS sur les tables de contenu + règle de lint interdisant l'import non justifié de `prismaService`    | M        |
| SEC-4 | P2                   | Dépendance de production sur `next-auth@5.0.0-beta.25` (pré-release)                                                                        | `apps/web/package.json`, `packages/auth/package.json`  | Verrouiller la version, plan de migration vers release stable                                                  | S puis M |
| SEC-5 | P3                   | `Profile.birthDate` commenté "chiffré au repos" mais typé en clair côté Prisma — à confirmer au niveau SQL                                  | `packages/db/prisma/schema.prisma:344`                 | Vérifier la migration ; implémenter si absent (`pgp_sym_encrypt`) ou corriger le commentaire                   | S à M    |
| SEC-6 | P3                   | `.git/index.lock` résiduel (0 octet) dans l'arbre de travail                                                                                | `.git/index.lock`                                      | Vérifier qu'aucun process Git n'est bloqué avant de le supprimer                                               | XS       |
| SEC-7 | Assumé, à documenter | Rate limiting Redis en fail-open : une panne Redis désactive silencieusement toute limite anti brute-force                                  | `packages/rate-limit/src/limit.ts`                     | Décision produit déjà tranchée et documentée comme compromis V1 ; à revisiter si le volume d'attaques augmente | —        |

**Aucun secret en clair trouvé dans le code source ou les fichiers suivis par
Git.** Les fichiers `.env`, `apps/web/.env`, `packages/db/.env` existent sur
disque mais **ne sont pas suivis par Git** (confirmé par `git ls-files`) et sont
couverts par `.gitignore`. Seuls les noms de variables ont été listés dans ce
rapport (§16), jamais leurs valeurs. Aucun motif de type clé AWS, clé privée PEM
ou clé Stripe live détecté par recherche de motifs dans le code source suivi.

Le fichier `.env` local contient une variable `SERVICE_DATABASE_URL` absente de
`.env.example` — écart de documentation (P3) : un nouveau développeur ne saurait
pas qu'elle est nécessaire pour `prismaService`.

---

## 16. Variables d'environnement (noms uniquement, aucune valeur exposée)

| Variable                                                                                           | Application            | Obligatoire               | Client/serveur               | Risque si exposée                         |
| -------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------- | ---------------------------- | ----------------------------------------- |
| `DATABASE_URL`, `DIRECT_URL`                                                                       | web, db                | Oui                       | Serveur                      | Élevé — accès complet DB                  |
| `SERVICE_DATABASE_URL` (en local, absent de `.env.example`)                                        | db (prismaService)     | Oui si RLS bypass utilisé | Serveur                      | Critique — bypass RLS potentiel           |
| `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `AUTH_DEBUG`                                         | auth                   | Oui (sauf debug)          | Serveur                      | Élevé — falsification de session si fuite |
| `AUTH_GOOGLE_ID/SECRET`, `AUTH_APPLE_ID/SECRET`                                                    | auth                   | Non (OAuth conditionnel)  | Serveur                      | Moyen                                     |
| `REDIS_URL`, `REDIS_PASSWORD` (prod)                                                               | rate-limit             | Non (no-op si absent)     | Serveur                      | Moyen                                     |
| `SMTP_HOST/PORT/USER/PASSWORD/SECURE/FROM`                                                         | email                  | Oui                       | Serveur                      | Moyen — usurpation d'envoi                |
| `S3_*`, `MINIO_*`                                                                                  | stockage               | Oui en prod               | Serveur                      | Moyen                                     |
| `STRIPE_*`                                                                                         | paiement (non branché) | Non utilisé actuellement  | Serveur/Client (publishable) | Élevé le jour où Stripe sera branché      |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`                                                                  | observabilité          | Non                       | Mixte                        | Faible à moyen                            |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE`, `NEXT_PUBLIC_SUPPORTED_LOCALES`               | web                    | Oui                       | **Client**                   | Faible (public par nature)                |
| `FEATURE_PARENT_DASHBOARD`, `FEATURE_PUBLIC_CATALOG`                                               | web                    | Non                       | Serveur                      | Faible (flags)                            |
| `PURGE_ACCOUNTS_SECRET`                                                                            | cron                   | Oui pour l'endpoint purge | Serveur                      | Élevé — protège la purge Loi 25           |
| `B2_*`, `BACKUP_AGE_RECIPIENT`, `BACKUP_RETENTION_DAYS`, `TRAEFIK_ACME_EMAIL`, `APP_DOMAIN` (prod) | infra                  | Oui en prod               | Serveur/infra                | Moyen à élevé                             |

Validation au démarrage : des fichiers `env.ts` dédiés existent dans
`packages/auth`, `packages/email`, `packages/rate-limit` — bonne pratique
confirmée par leur présence (contenu non détaillé ligne à ligne ici).

---

## 17. Qualité du code

Signaux mesurés directement (recherche exhaustive, pas d'estimation) :

| Indicateur                                                       | Résultat                                                                                                    | Interprétation                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `console.log` dans le code applicatif                            | 0                                                                                                           | Excellent                                            |
| `any` explicite hors code généré (`.next/`, `generated/client/`) | 70 occurrences, **toutes dans `.next/types/**` auto-généré par Next.js\*\*, aucune dans le code source réel | Excellent — le typage strict est réellement respecté |
| `@ts-ignore` / `@ts-expect-error`                                | 3, toutes dans un fichier de test (`account.test.ts`), usage légitime pour tester des entrées invalides     | Bon                                                  |
| `eslint-disable`                                                 | 3, toutes justifiées ponctuellement                                                                         | Bon                                                  |
| `TODO` / `FIXME` / `HACK` dans le code applicatif                | 0 (les 3 occurrences trouvées sont dans le runtime généré de Prisma)                                        | Excellent                                            |
| Fichiers `*.test.ts(x)`                                          | 22 dans `apps/web` + `packages/*`                                                                           | Correct pour la taille du produit, mais inégal (§18) |

Ce niveau de propreté est net au-dessus de ce qu'on trouve dans un projet codé
rapidement sans discipline — signal factuel important : les défauts identifiés
(RLS partielle, typecheck cassé, tests manquants sur les flux famille/admin)
sont des trous de couverture identifiables et corrigeables, pas des symptômes de
code bâclé en général.

`ExercisePractice.tsx` a été identifié dans les logs d'erreur de typecheck avec
une ligne 720 — un composant unique dépassant 700 lignes est un candidat naturel
à la décomposition.

---

## 18. Tests, build et exécution

| Suite / commande                                                         | Exécutée dans cette session ?                                                              | Résultat                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                                           | Non                                                                                        | `pnpm` absent du sandbox ; `corepack enable` a échoué (`EACCES`, permission refusée pour créer le symlink `/usr/bin/pnpm`)                                                                                                                                                                                                                                      |
| `pnpm lint` (web)                                                        | Non (log en cache lu)                                                                      | `apps/web/.turbo/turbo-lint.log`, daté 2026-04-29 : commande lancée, aucune ligne d'erreur dans le log conservé — probablement OK mais code de sortie non confirmé dans le fichier                                                                                                                                                                              |
| `pnpm typecheck` (web)                                                   | Non (log en cache lu)                                                                      | **Échec confirmé** : 8 erreurs TypeScript, `exit code 2`, log daté 2026-05-15 13:01. Fichiers en cause : `ExercisePractice.tsx` (2 erreurs), `ParentDashboardForm.tsx` (1), `admin/actions.ts` (3, `exactOptionalPropertyTypes`), `learning/actions.ts` (1, type `ScorableAnswer`/`pairId`), `purgeExpiredAccounts.test.ts` (6, `Object is possibly undefined`) |
| `pnpm test` (web)                                                        | Non (log en cache lu)                                                                      | **1 fichier en échec / 13 passés / 1 skip**, 113 tests passés / 2 skip sur 115 ; échec = `purgeExpiredAccounts.test.ts` (`ReferenceError: Cannot access 'mockFindMany' before initialization`, bug de hoisting `vi.mock`), log daté 2026-05-15 13:00                                                                                                            |
| `pnpm typecheck`/`test` (`auth`, `email`, `rate-limit`)                  | Non (logs en cache lus)                                                                    | Tous OK : 22 + 4 + 10 tests passants, aucune erreur de typecheck                                                                                                                                                                                                                                                                                                |
| `pnpm typecheck`/`test` (`config`, `db`, `i18n`, `types`, `ui`, `utils`) | Non (logs en cache lus)                                                                    | Aucune erreur de typecheck ; "No test files found" pour les 6 (aucun test dans ces paquets)                                                                                                                                                                                                                                                                     |
| `pnpm build` (web)                                                       | Non tenté (dépend d'un typecheck déjà en échec, et d'une base Postgres non disponible ici) | Non exécuté                                                                                                                                                                                                                                                                                                                                                     |
| Build Docker                                                             | Non tenté                                                                                  | Non exécuté                                                                                                                                                                                                                                                                                                                                                     |
| E2E Playwright                                                           | Non (résultat en cache lu)                                                                 | `apps/web/test-results/.last-run.json` → `{"status":"passed","failedTests":[]}`                                                                                                                                                                                                                                                                                 |

**Cause du blocage** : `corepack enable` renvoie `EACCES` sur le symlink
`/usr/bin/pnpm` (permissions système du sandbox), et le `node_modules` présent
sur disque a été installé sur une machine Windows — le binaire natif `turbo` est
absent de la copie accessible ici, donc même `node_modules/.bin/turbo` échoue
(`MODULE_NOT_FOUND`). Ce n'est pas un défaut du projet, c'est une limite de
l'environnement d'audit. **Recommandation : l'équipe doit relancer
`pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` sur une
machine de développement normale avant de considérer ce rapport comme confirmant
un état "vert".**

**Fonctionnalités sans aucun test automatisé identifié** : `admin/actions.ts`
(CRUD + validations de publication complexes), `family/actions.ts` (rattachement
parent-enfant, sujet Loi 25 sensible), `middleware.ts` (routage i18n + auth).
Trois zones à combler en priorité (§20, P1-2/P1-3).

Aucun outil de scan automatisé de dépendances (Semgrep, Snyk, `pnpm audit` en
CI) ni de test d'accessibilité automatisé (axe-core, pa11y) n'a été trouvé dans
la configuration CI.

---

## 19. Performance

Analyse limitée (pas de profiling réel possible sans build fonctionnel) :

- **Frontend** : pas de `next/dynamic` ni de code-splitting explicite repéré
  dans les pages inspectées — à surveiller si le bundle grossit (raisonnable au
  stade actuel).
- **Backend** : `submitQuizAttempt` fait plusieurs requêtes séquentielles dans
  une transaction (recherche de progression existante puis upsert par compétence
  en boucle) — correct pour le volume V1, point de vigilance N+1 si le nombre de
  compétences par activité grandit significativement.
- **Base de données** : index déclarés cohérents avec les patterns de requête
  observés. Pas de test de charge, pas de `EXPLAIN ANALYZE` disponible dans ce
  sandbox.
- **RLS et coût** : `app_is_verified_parent_of` exécute une sous-requête par
  ligne évaluée ; à surveiller à volume élevé, partiellement couvert par l'index
  unique existant sur `parent_child_links(parentId, childId)`.

Rien d'alarmant à ce stade de volumétrie (produit non lancé), mais aucun test de
charge n'a été exécuté — à prévoir avant un lancement public.

---

## 20. DevOps, déploiement et documentation

CI GitHub Actions (`ci.yml`) : 6 jobs parallèles + agrégateur `ci` en required
check. `build-web` utilise un vrai service Postgres éphémère et applique les
migrations avant le build. `migrations-check.yml` détecte la dérive
schéma/migrations via `prisma migrate diff`, seulement déclenché quand
`packages/db/prisma/**` change — bonne portée.

Il est possible, mais non confirmé dans ce sandbox (pas d'accès à GitHub), que
la CI réelle sur `main` soit verte malgré l'échec du dernier run local capturé —
les 85 fichiers modifiés localement n'ont pas encore été poussés.

Docker : image multi-stage, non-root, `tini`, healthcheck, taille cible <200 Mo.
Backup : scripts `pg_dump` + `age` (chiffrement) + réplication MinIO vers
Backblaze B2 documentés (contenu non ouvert en détail dans cet audit). Infra
cible : VM Proxmox unique, Traefik + Cloudflare, pas de haute disponibilité —
choix V1 assumé et cohérent avec la taille de l'équipe.

**Documentation.** Qualité rédactionnelle largement supérieure à la moyenne ;
`09-implementation-status.md` joue explicitement le rôle de "juge de paix" face
aux documents de vision — discipline rare. Incohérences trouvées :

- `01-architecture.md` mentionne NativeWind pour `packages/ui` côté mobile, non
  trouvé dans les dépendances `apps/mobile/package.json` lues (`expo`,
  `expo-router`, `react-native` uniquement) — à confirmer.
- `SERVICE_DATABASE_URL` utilisée dans le code mais absente des fichiers
  `.env*.example` (§15, §16).
- Le README affiche un badge CI sans qu'on puisse confirmer, depuis ce sandbox,
  si `main` est actuellement vert sur GitHub — à vérifier directement par
  l'équipe.

---

## 21. Conformité et protection des données

Éléments favorables confirmés dans le code :

- `ConsentRecord` créé en transaction à l'inscription, append-only.
- `AuditLog` append-only, couvre les événements sensibles listés.
- Export Loi 25 en JSON (route testée), suppression avec délai de grâce 30 jours
  (`disabledAt` immédiat, purge différée via cron protégé par secret).
- Flux de consentement parental avec double confirmation (code + lien email) et
  enregistrement IP/user-agent des deux parties.

Points nécessitant une validation juridique (aucune conclusion légale définitive
n'est rendue ici) :

- `Profile.birthDate` (donnée sensible d'un mineur) — confirmer si le
  chiffrement au repos mentionné en commentaire est réellement implémenté
  (SEC-5).
- Conservation 7 ans des `consent_records` : mentionnée dans la doc, pas
  vérifiée comme contrainte technique appliquée au-delà de
  `purgeExpiredAccounts`.
- Le code de rattachement à 6 chiffres via `Math.random()` (SEC-1) a une
  dimension de protection des mineurs — à traiter comme prioritaire précisément
  parce que le sujet touche un mineur.
- Loi 25 (Québec), LPRPDE (fédéral), COPPA/FERPA (si expansion É.-U.) : domaines
  à faire valider par un conseiller juridique avant tout lancement public, en
  particulier le mécanisme de consentement parental vérifiable.

---

## 22. Registre des problèmes

| ID   | Priorité | Domaine                | Titre                                                                                                   | Fichiers                                                                                                                     | Impact                                                                                            | Recommandation                                                                                                             | Effort   |
| ---- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| P0-1 | **P0**   | Build                  | Le typecheck `apps/web` échoue (8 erreurs, dernier run local daté 2026-05-15)                           | `ExercisePractice.tsx`, `ParentDashboardForm.tsx`, `admin/actions.ts`, `learning/actions.ts`, `purgeExpiredAccounts.test.ts` | Bloque potentiellement le merge/déploiement si non corrigé avant de pousser les fichiers modifiés | Corriger les erreurs `exactOptionalPropertyTypes` et le typage `pairId` optionnel dans `ScorableAnswer`/`ScorableQuestion` | S        |
| P0-2 | **P0**   | Tests                  | 1 suite de test en échec (`purgeExpiredAccounts.test.ts`, bug de hoisting `vi.mock`)                    | `apps/web/src/lib/purge/purgeExpiredAccounts.test.ts`                                                                        | Le cron de purge Loi 25 n'est plus couvert par un test qui passe                                  | Réordonner la déclaration du mock (`vi.mock` doit référencer une factory, pas une variable non encore initialisée)         | XS       |
| P1-1 | P1       | Sécurité               | Code de rattachement parent-enfant généré par `Math.random()`                                           | `family/actions.ts:337`                                                                                                      | Prévisibilité potentielle d'un code protégeant un lien vers un compte mineur                      | `crypto.randomInt`                                                                                                         | XS       |
| P1-2 | P1       | Tests                  | Aucun test automatisé sur `family/actions.ts` (flux consentement parental)                              | `family/actions.ts`                                                                                                          | Flux sensible Loi 25 sans filet de non-régression                                                 | Tests unitaires + un test RLS dédié                                                                                        | S        |
| P1-3 | P1       | Tests                  | Aucun test automatisé sur `admin/actions.ts` (CRUD contenu + validations complexes)                     | `admin/actions.ts`                                                                                                           | Risque de régression silencieuse sur la validation de publication                                 | Tests ciblant `validateQuestionForPublishing` et les Server Actions                                                        | S        |
| P1-4 | P1       | Architecture/Sécurité  | RLS non confirmée sur les routes admin/famille (usage de `prismaService`)                               | `admin/actions.ts`, `family/actions.ts`                                                                                      | Défense en profondeur absente si le contrôle de rôle applicatif est un jour contourné             | Policies RLS + règle de lint restreignant `prismaService`                                                                  | M        |
| P2-1 | P2       | Sécurité               | Comparaison non constante du secret cron                                                                | `api/cron/purge-accounts/route.ts`                                                                                           | Risque théorique de timing attack                                                                 | `crypto.timingSafeEqual`                                                                                                   | XS       |
| P2-2 | P2       | Dépendances            | `next-auth` en version beta en production                                                               | `package.json` (web, auth)                                                                                                   | Risque de breaking change amont                                                                   | Veille + plan de migration                                                                                                 | S puis M |
| P2-3 | P2       | Tests                  | 6 paquets sur 10 sans aucun test (`config`, `db`, `i18n`, `types`, `ui`, `utils`)                       | `packages/{config,db,i18n,types,ui,utils}`                                                                                   | Composants partagés et fonctions pures non couverts                                               | Prioriser `ui` (rendu) et `utils` (fonctions pures)                                                                        | S à M    |
| P2-4 | P2       | Documentation          | Écarts doc/code (`SERVICE_DATABASE_URL` absent de `.env.example`, NativeWind mentionné mais non trouvé) | `.env.example`, `01-architecture.md`                                                                                         | Onboarding plus difficile                                                                         | Mettre à jour la doc et les fichiers d'exemple dans la même PR que le code                                                 | XS       |
| P3-1 | P3       | Hygiène dépôt          | Fichiers résiduels (`_tmp_3_*`, `.code-review-graph/`, `.git/index.lock`)                               | racine, `.git/`                                                                                                              | Bruit dans le dépôt, aucun risque fonctionnel                                                     | Nettoyer et ajouter au `.gitignore` si pertinent                                                                           | XS       |
| P3-2 | P3       | Sécurité (à confirmer) | Chiffrement de `Profile.birthDate` mentionné en commentaire mais non confirmé au niveau SQL             | `schema.prisma`, migrations                                                                                                  | Donnée sensible potentiellement non chiffrée malgré la documentation                              | Vérifier la migration correspondante ; implémenter si absent                                                               | S à M    |
| P3-3 | P3       | Qualité                | Composant `ExercisePractice.tsx` volumineux (>700 lignes)                                               | `ExercisePractice.tsx`                                                                                                       | Maintenabilité                                                                                    | Décomposer par type d'exercice                                                                                             | S        |

**Synthèse : P0 = 2, P1 = 4, P2 = 4, P3 = 3.**

---

## 23. Score de maturité

| Catégorie             | Note /10       | Justification                                                                                                                 |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Architecture          | 7              | Couches claires, RLS + audit append-only bien pensés ; pénalisé par la coexistence non garde-fouée `withUser`/`prismaService` |
| Organisation du dépôt | 7              | Monorepo propre, quelques résidus et un arbre de travail non commité volumineux                                               |
| Qualité du code       | 8              | Zéro `console.log`, `any` quasi nul, discipline de commentaires réelle ; pénalisé par le typecheck actuellement cassé         |
| Frontend              | 6              | Structure App Router cohérente ; un composant trop gros, pas de code-splitting explicite                                      |
| UI/UX                 | 5              | Design system présent, non auditable visuellement dans ce sandbox — note prudente                                             |
| Accessibilité         | 4              | Champs de préférence en base mais effectivité non vérifiée ; aucun test automatisé                                            |
| Backend               | 7              | Server Actions propres, validation Zod cohérente, gestion d'erreur disciplinée                                                |
| Base de données       | 8              | Schéma soigné, migrations vérifiées par CI dédiée, append-only réel                                                           |
| Sécurité              | 6              | Argon2id conforme, anti-énumération réelle, mais RLS partielle + code parent-enfant non cryptographique                       |
| Authentification      | 7              | Auth.js v5 bien intégré, sessionVersion pour invalidation serveur, mais dépendance beta                                       |
| Autorisations         | 6              | Matrice de rôles cohérente, mais deuxième couche RLS non confirmée sur admin/famille                                          |
| Tests                 | 5              | Bonne couverture sur auth/rate-limit/email, zéro test sur admin/famille, 1 suite en échec, 6 paquets sans aucun test          |
| Performance           | 6 (non mesuré) | Rien d'alarmant au vu du code, mais aucune mesure réelle effectuée                                                            |
| DevOps                | 7              | CI multi-jobs, Docker soigné, migrations-check dédié                                                                          |
| Documentation         | 8              | Qualité rédactionnelle et honnêteté rares ; quelques écarts mineurs avec le code                                              |
| Maintenabilité        | 7              | Code lisible et modulaire, quelques fichiers à décomposer                                                                     |
| Évolutivité           | 6              | Architecture prête à grandir, rôles figés sur 4 valeurs                                                                       |
| Observabilité         | 4              | Logs structurés + healthcheck seulement, pas de métriques/traces — assumé en V1                                               |
| Conformité            | 6              | Bonnes fondations Loi 25, mais un point de chiffrement à confirmer et un mécanisme de consentement à sécuriser                |
| Maturité produit      | 4              | Un seul parcours pédagogique complet, gamification/paiement/mobile non livrés                                                 |

**Score global (moyenne simple) : 6.2/10** — socle technique nettement au-dessus
de la moyenne, freiné par un produit fonctionnellement incomplet et par deux
problèmes bloquants immédiats (typecheck, test) à résoudre avant de considérer
l'état du dépôt comme stable.

---

## 24. Plan de remédiation

**Phase 0 — Sécurisation immédiate**

- Corriger SEC-1 (`crypto.randomInt`) — XS.
- Vérifier SEC-5 (chiffrement `birthDate`) et corriger si absent — S à M.
- Critère d'acceptation : code de rattachement non prévisible, confirmation
  écrite sur le chiffrement de `birthDate`.

**Phase 1 — Stabilisation**

- Corriger les 8 erreurs de typecheck (P0-1) — S.
- Corriger le test en échec (P0-2) — XS.
- Faire tourner
  `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` sur
  une machine réelle, confirmer un exit code 0 partout — critère non négociable
  avant la suite.
- Nettoyer les résidus de dépôt (P3-1) — XS.

**Phase 2 — Architecture**

- Policies RLS sur les tables de contenu/admin (P1-4) — M.
- Règle de lint restreignant `prismaService` — S.
- Dépendances : Phase 1 terminée.

**Phase 3 — Sécurité et autorisations**

- `crypto.timingSafeEqual` pour le secret cron (P2-1) — XS.
- Plan de veille/migration `next-auth` stable (P2-2) — S puis M.
- Test d'intégration RLS générique (fail-closed prouvé) — M.

**Phase 4 — Qualité fonctionnelle**

- Tests sur `family/actions.ts` et `admin/actions.ts` (P1-2, P1-3) — S chacun.
- Exposer les types d'exercice restants en pratique guidée (roadmap déjà
  identifiée dans `09-implementation-status.md`).

**Phase 5 — UI/UX et accessibilité**

- Audit visuel réel (Playwright + axe-core) une fois le build restauré — M.
- Confirmer le branchement effectif de `reducedMotion`/`highContrast` — S.
- Décomposer `ExercisePractice.tsx` — S.

**Phase 6 — Tests et qualité continue**

- Couverture des paquets `ui` et `utils` (P2-3) — S à M.
- Ajouter un scan de dépendances (`pnpm audit` ou équivalent) en CI — XS.

**Phase 7 — Performance et observabilité**

- Test de charge basique sur `submitQuizAttempt` avant tout lancement public —
  M.
- Décision sur la stack d'observabilité (déjà planifiée en Phase 2 produit selon
  la doc) — L.

**Phase 8 — Préparation production**

- Validation juridique Loi 25/consentement mineur (§21) — externe.
- Test réel de restauration de backup — M.
- Mise à jour de la documentation (P2-4) dans les PR correspondantes — continu.

---

## 25. Roadmap recommandée

1. Stabiliser (Phase 0-1) avant tout nouveau développement fonctionnel — les 85
   fichiers modifiés non commités doivent être ramenés à un état vert avant
   merge.
2. Merger et sécuriser le parcours mineur/parent (déjà en grande partie écrit
   dans l'arbre de travail non commité) avec les tests et la RLS manquants.
3. Achever l'exposition des types d'exercice restants et l'admin content (déjà
   bien avancé).
4. Dashboard parent réel + notifications.
5. Paiement Stripe.
6. Mobile au-delà du squelette.
7. Observabilité et durcissement production (Phase 7-8).

---

## 26. Verdict final

**GO POUR STABILISATION.**

Justification : le socle (architecture, sécurité des mots de passe, RLS
partielle mais réelle, CI, Docker, documentation) est d'une qualité qui
justifierait normalement un verdict plus favorable. Mais deux faits factuels et
vérifiés empêchent un verdict "GO POUR MVP" à la date de cet audit : le
typecheck échoue et une suite de tests échoue sur le dernier run local capturé,
et l'arbre de travail contient 108 fichiers modifiés/non suivis non encore
intégrés à `main`. Tant que ces deux points ne sont pas résolus et confirmés par
une exécution réelle (hors de ce sandbox), aucun déploiement ne devrait être
envisagé. Une fois la Phase 1 terminée et confirmée verte, le produit reste un
MVP incomplet (pas de paiement, pas de mobile réel, gamification absente) mais
techniquement sain — à ce moment-là, un verdict "GO POUR MVP" deviendrait
défendable pour la seule surface aujourd'hui livrée (apprentissage adulte solo).

---

## Résumé de fin d'exécution

- **Rapport créé** : `docs/audit-complet-eduquiz.md`
- **Branche analysée** : `main`
- **Commit analysé** : `c146035` (2026-05-14), arbre de travail non propre (85
  modifiés + 23 non suivis)
- **Dossiers examinés** : `apps/web`, `apps/mobile`, tous les `packages/*`,
  `infra/docker`, `.github/workflows`, `docs/`
- **Fichiers examinés en détail** (lus intégralement ou en grande partie) : ~35
  fichiers sources/config/SQL/CI, plus une recherche exhaustive par motif sur
  l'ensemble des fichiers `.ts`/`.tsx` du monorepo (450 fichiers hors
  dépendances/build)
- **Fichiers ignorés et justification** : `node_modules/`, `.turbo/` (sauf
  logs), `.pnpm-store/`, `.next/` (sauf pour confirmer la nature générée du
  code), le contenu binaire Prisma généré, les 38 pages de vitrine publique
  (hors périmètre à risque, temps limité), le détail complet de 5 des 8 fichiers
  RLS (`10_identity.sql`, `30_consent_audit.sql`, `40_billing.sql`,
  `60_communications.sql`, `70_catalogue.sql`)
- **Fonctionnalités détectées** : ~16 domaines fonctionnels cartographiés (§7)
- **P0** : 2 — **P1** : 4 — **P2** : 4 — **P3** : 3
- **Résultat du lint** : non ré-exécuté ; log en cache (2026-04-29) sans erreur
  visible mais code de sortie non confirmé
- **Résultat du typecheck** : **échec confirmé** (log 2026-05-15, 8 erreurs,
  exit code 2) pour `apps/web` ; OK pour tous les autres paquets d'après leurs
  logs
- **Résultat des tests** : **1 fichier en échec**
  (`purgeExpiredAccounts.test.ts`) / 113 passés / 2 skip sur 115 pour `apps/web`
  (log 2026-05-15) ; tous verts pour `auth`, `email`, `rate-limit` ; Playwright
  `passed` (dernier run)
- **Résultat du build** : non exécuté (pnpm indisponible dans le sandbox)
- **Score global** : 6.2/10
- **Verdict final** : GO POUR STABILISATION

**Commandes qui n'ont pas pu être exécutées et raison** : `pnpm install`,
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, tout build Docker —
`pnpm` absent du sandbox, `corepack enable` refusé par permission système
(`EACCES`), et le `node_modules` présent sur disque (installé sous Windows) ne
contient pas le binaire natif `turbo` exploitable dans cet environnement Linux.
Les résultats de build/test cités proviennent de logs réels laissés en cache par
la dernière exécution locale de l'équipe, pas d'une exécution faite pendant cet
audit.

**Limites de l'analyse** :

- Pas de rendu visuel réel (UI/UX, accessibilité) — analyse basée sur le code
  source uniquement.
- 5 des 8 fichiers RLS non ouverts en détail — à vérifier avant toute conclusion
  définitive sur la couverture RLS complète.
- Contenu détaillé des scripts de backup non audité ligne à ligne.
- Les 38 pages de la vitrine publique non revues individuellement.
- Aucune tentative de pénétration active — analyse statique uniquement.

**Validations manuelles encore nécessaires** :

- Ré-exécuter
  `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` sur
  une machine de développement réelle et confirmer le résultat.
- Confirmer si le chiffrement de `Profile.birthDate` existe réellement au niveau
  SQL (SEC-5).
- Confirmer l'état réel du CI GitHub Actions sur `main` (accès non disponible
  dans ce sandbox).
- Validation juridique Loi 25 / consentement parental par un professionnel
  qualifié.
- Audit d'accessibilité WCAG avec outillage réel (axe-core) une fois le build
  restauré.
