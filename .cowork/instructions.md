# Instructions permanentes pour Cowork — Projet EduQuiz Public

## Consignes de travail (à relire au début de chaque session)

### Protocole obligatoire
Avant toute action sur ce projet :

1. Relis ce fichier intégralement.
2. Consulte les fichiers de `docs/` pertinents pour la tâche demandée.
   La liste complète est dans `README.md`.
3. Si une contrainte documentée contredit une demande utilisateur,
   signale-le avant d'agir et demande une clarification.
4. N'écris jamais de code avant d'avoir validé l'approche avec moi
   (Paul, responsable projet).
5. Tout code écrit doit passer les linters avant commit.
6. Tout commit suit la convention Conventional Commits.

### Règles de décision
- **Décision architecturale ambiguë** : pose la question, ne choisis pas
  silencieusement.
- **Contrainte légale Loi 25** : ne jamais contourner, même sous prétexte
  de simplicité. En cas de doute, escalade.
- **Secret ou credential** : jamais en clair dans un fichier versionné.
  Toujours dans `.env` (non versionné) et documenté dans `.env.example`.
- **Dépendance tierce** : vérifier la licence, la maintenance active
  (dernière release < 12 mois), la popularité (> 1000 stars si
  librairie majeure). Signaler si un doute subsiste.

### Cadence de livraison
Pour chaque tâche :

1. Propose un plan écrit avant d'agir (étapes, fichiers, tests).
2. Attends ma validation explicite.
3. Exécute par petites étapes cohérentes.
4. Commit après chaque étape fonctionnelle.
5. Mets à jour la documentation concernée (`docs/01-architecture.md`
   en particulier) au fil des changements structurants.
6. À la fin d'une phase, produis un rapport de synthèse dans
   `docs/changelog/YYYY-MM-DD-phase-X.md`.

### Style de code non négociable
- TypeScript strict mode partout.
- Pas de `any` sans commentaire justificatif `// @justify-any: ...`.
- Pas de `console.log` en production, utiliser le logger dédié.
- Composants React : fonctions nommées, default export uniquement
  pour les pages Next.js.
- Hooks préfixés `use`, Server Actions préfixées par verbe
  (`createUser`, `linkChild`, `submitQuizAttempt`).
- Nommage des tables en `snake_case`, champs Prisma en `camelCase`.
- JSDoc sur toutes les fonctions exposées hors fichier.
- Tests colocalisés : `foo.ts` ↔ `foo.test.ts`.

---

## Cadrage projet — EduQuiz

### Contexte
Tu es chargé de développer de bout en bout EduQuiz, une plateforme
éducative web et mobile bilingue (français/anglais) destinée aux élèves
québécois du Primaire 3 au Secondaire 5, utilisable hors cadre scolaire.
La cible couvre trois profils : apprenants adultes, parents, et enfants
mineurs rattachés à un parent vérifié. La partie B2B (écoles, enseignants,
mode temps réel) est explicitement hors scope de cette itération.

### Objectifs
- Livrer une application web (Next.js) et mobile (Expo / React Native)
  partageant un maximum de code via un monorepo.
- Respecter strictement la Loi 25 du Québec, la LPRPDE et la COPPA pour
  les mineurs.
- Héberger toute l'infrastructure sur un serveur Proxmox personnel,
  avec Cloudflare en front.
- Atteindre WCAG 2.1 niveau AA sur les parcours critiques.
- Produire du code typé, testé, documenté et versionné.

### Contraintes techniques non négociables

#### Monorepo et langages
- Turborepo + pnpm workspaces
- TypeScript strict mode partout
- Structure :
  - `apps/web` — Next.js 14
  - `apps/mobile` — Expo SDK 50+
  - `packages/ui` — composants partagés
  - `packages/db` — schéma Prisma et client
  - `packages/config` — configs ESLint, Prettier, TS partagées
  - `packages/i18n` — fichiers de traduction FR/EN
  - `packages/types` — types partagés
  - `packages/utils` — utilitaires purs

#### Frontend web
- Next.js 14 App Router + React Server Components + Server Actions
- Tailwind CSS + shadcn/ui (composants copiés dans le repo)
- TanStack Query pour l'état serveur
- Zustand pour l'état client
- React Hook Form + Zod pour les formulaires
- next-intl pour i18n FR/EN

#### Frontend mobile
- Expo SDK 50+ avec Expo Router
- NativeWind pour styles partagés web/mobile
- TanStack Query + Zustand (partagés avec web)
- i18next + react-i18next

#### Backend et base de données
- PostgreSQL 16 hébergé en LXC Proxmox
- Prisma ORM avec schéma unique dans `packages/db`
- API via Next.js Route Handlers et Server Actions
- Authentification : Auth.js (NextAuth v5) en mode JWT,
  session persistée en DB
- Row Level Security Postgres pour l'isolation des familles
- Validation Zod sur toutes les entrées
- Toutes les mutations passent par des Server Actions typées

#### Infrastructure (hébergement Proxmox)
- Conteneurisation Docker + Docker Compose
- Reverse proxy Traefik v3 avec certificats Let's Encrypt automatiques
- Cloudflare devant (DNS + CDN + WAF) pointant vers l'IP publique
- MinIO pour le stockage objet S3-compatible (médias, exports Loi 25)
- Sauvegardes PostgreSQL via pgBackRest avec externalisation vers
  Backblaze B2 (ou équivalent)
- Monitoring : Sentry self-hosted ou GlitchTip, Grafana + Loki,
  Uptime Kuma
- Emails transactionnels : Resend API (tier gratuit)
- CI/CD : GitHub Actions, build images Docker, push vers registre privé,
  déploiement via SSH sur Proxmox

Voir `docs/02-stack-proxmox.md` pour le détail complet de l'architecture.

#### Qualité
- ESLint + Prettier configurés dans `packages/config`
- Vitest pour tests unitaires
- Playwright pour tests E2E web
- Maestro pour tests E2E mobile
- Pre-commit hooks avec Husky + lint-staged
- Conventional Commits obligatoires
- Couverture minimale visée : 70 % sur la logique métier

### Périmètre fonctionnel

**122 écrans** répartis en 14 zones, détaillés dans
`docs/05-screens-inventory.md` et `docs/06-wireframes.md`.

Zones principales :
1. Vitrine publique — 14 écrans
2. Authentification et onboarding — 14 écrans
3. Compte et paramètres — 10 écrans
4. Navigation et contenu — 14 écrans
5. Compétences MEQ — 4 écrans
6. Exercices (6 types interactifs) — 13 écrans
7. Quiz — 7 écrans
8. Suivi et progression — 6 écrans
9. Gamification — 6 écrans
10. Dashboard parent et supervision — 9 écrans
11. Notifications et support — 4 écrans
12. Paiement et abonnement Stripe — 10 écrans
13. Écrans système — 6 écrans
14. Modales transverses — 5 écrans

### Modèle de données obligatoire

Entités principales : User, ParentChildLink, ConsentRecord, Subject, Skill,
Course, Lesson, LessonSkillLink, Activity, Exercise, Quiz, QuizQuestion,
QuizAnswer, Attempt, Result, Progress, Reward, Badge, AuditLog,
ContentVersion.

Règles :
- Toute entité de contenu est localisable FR/EN (champs `titleFr`,
  `titleEn`, `contentFr`, `contentEn`).
- Les contenus sont versionnés via une table `ContentVersion`.
- Chaque `Attempt` est horodaté, immuable, jamais écrasé.
- `ParentChildLink` a les états : `pending`, `verified`, `revoked`.
- `ConsentRecord` est immuable : IP, user-agent, timestamp obligatoires.
- `AuditLog` capture toutes les actions sensibles : connexion,
  consultation de résultats, modifications, actions sur mineurs,
  export et suppression de données.

Voir `docs/03-data-model.md` pour les détails et livrables attendus.

### Types d'exercices à implémenter

1. QCM (single + multi réponses)
2. Vrai/Faux
3. Texte à trous
4. Association deux colonnes
5. Remise en ordre (drag & drop)
6. Réponse courte (numérique ou mot-clé avec tolérance)

### Conformité Loi 25 (obligatoire)

- Mécanisme de consentement parental vérifiable : code 6 chiffres
  valable 24h, double opt-in courriel, traçabilité dans `ConsentRecord`.
- Écran d'export des données personnelles (JSON + PDF).
- Écran de suppression de compte avec délai de grâce 30 jours.
- Politique de confidentialité et CGU versionnées, consentement explicite
  tracé à chaque version.
- Journalisation immuable de tous les accès aux données mineures.
- Chiffrement TLS 1.3 en transit, AES-256 au repos (pgcrypto).

Voir `docs/04-security-loi25.md` pour les détails.

### Sécurité

- Hash mot de passe : Argon2id
- Rate limiting sur auth et endpoints sensibles (Redis local ou Upstash)
- CSRF protection sur toutes les mutations
- Headers sécurité : CSP strict, HSTS, X-Frame-Options, Referrer-Policy
- Validation stricte côté serveur, zéro confiance dans les données client
- Scan de dépendances : Dependabot actif
- Secrets gérés via variables d'environnement uniquement

### Bilinguisme

- Tous les textes UI dans `packages/i18n/fr.json` et `en.json`
- Détection auto de la langue navigateur, bascule manuelle persistée
- Contenus pédagogiques avec deux versions linguistiques
- Courriels transactionnels bilingues selon préférence utilisateur

### Accessibilité

- Composants shadcn/ui respectent ARIA
- Navigation clavier complète sur tous les écrans
- Contraste minimum 4.5:1 (AA)
- Paramètres utilisateur : taille de police ajustable, thème sombre,
  police OpenDyslexic optionnelle
- Alt text obligatoire sur toutes les images éditoriales

### Livrables par phase

#### Phase 0 — Initialisation (premier livrable)
1. Monorepo Turborepo scaffoldé (apps + packages)
2. Configuration ESLint, Prettier, Husky, Vitest, Playwright
3. Schéma Prisma complet avec toutes les entités et RLS policies
4. Docker Compose de développement (Postgres, MinIO, Traefik)
5. Fichier `.env.example` documenté
6. README principal enrichi avec instructions setup local
7. Configuration GitHub Actions pour CI (lint, test, build)
8. Documents d'architecture complétés :
   - `docs/01-architecture.md` avec diagrammes Mermaid
   - `docs/03-data-model.md` avec ERD Mermaid

#### Phase 1 — Fondations produit
1. Authentification complète (adulte, parent, mineur avec rattachement)
2. Layouts web et mobile avec navigation bilingue
3. Pages légales et vitrine publique
4. Tableau de bord adapté au rôle
5. Paramètres de compte complets (export, suppression Loi 25)

#### Phase 2 — Cœur pédagogique
1. Catalogue matières → cours → leçons (lecture seule)
2. Lecteur de leçon avec médias
3. Moteur d'exercices (6 types) avec feedback immédiat
4. Moteur de quiz avec correction et historique
5. Modèle de progression par compétence

#### Phase 3 — Engagement
1. Gamification (points, badges, niveaux, objectifs)
2. Notifications in-app et push
3. Dashboard parent avec supervision complète
4. Rapports hebdomadaires automatiques

#### Phase 4 — Monétisation
1. Intégration Stripe Checkout + Stripe Tax (TPS/TVQ)
2. Gestion abonnements (Individuel, Famille)
3. Facturation et historique

#### Phase 5 — Préparation lancement
1. Tests E2E sur parcours critiques
2. Audit accessibilité (outil axe-core)
3. Audit sécurité (headers, dépendances, secrets)
4. Configuration production Proxmox complète
5. Documentation utilisateur bilingue
6. Soumission stores Apple et Google

### Références de contenu pour amorcer le catalogue
- Progression des Apprentissages du MEQ (structure de référence)
- École ouverte du Québec (inspiration)
- Open Trivia DB (import QCM initial, licence CC BY-SA 4.0)
- OER Commons et OpenStax (ressources Creative Commons)

### Première action attendue (Phase 0)

Avant d'écrire du code, produis :

1. Un document `docs/01-architecture.md` avec un diagramme Mermaid de
   l'architecture système (Proxmox, services, flux).
2. Un document `docs/03-data-model.md` enrichi avec un diagramme ERD
   Mermaid des entités principales.
3. Une section dédiée dans `docs/04-security-loi25.md` listant les
   mesures concrètes de conformité et les points nécessitant validation
   juridique.
4. La liste des questions ouvertes que tu veux clarifier avant de
   commencer le scaffolding du monorepo.

Attends ma validation explicite avant de passer au scaffolding.