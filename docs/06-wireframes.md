# Wireframes textuels — EduQuiz Public

Les wireframes décrivent la structure, la hiérarchie visuelle et les interactions clés. Ils servent de base à la conception Figma, pas de spécification pixel-perfect.

**Notation utilisée :**
- `[BLOC]` = section visuelle
- `→` = action / navigation
- `(attr)` = propriété ou état
- `———` = séparateur visuel

---

## Zone 1 — Vitrine publique

### Écran 1 — Accueil / Landing

Parfait. Je te livre les 6 fichiers, chacun dans un bloc de code séparé prêt à copier-coller. Pour chacun, ouvre le fichier dans VS Code, copie le contenu du bloc et colle-le tel quel.

Fichier 1 — docs/00-project-brief.md
markdown# EduQuiz Public — Description détaillée du projet

## 1. Vue d'ensemble

EduQuiz Public est une plateforme éducative web et mobile destinée aux élèves du primaire et du secondaire au Québec, utilisable hors cadre scolaire. Elle permet aux apprenants de consolider leurs acquis via des leçons structurées, des exercices interactifs et des quiz, dans un environnement entièrement bilingue français/anglais.

La plateforme s'adresse à trois profils d'utilisateurs :

- des apprenants adultes qui souhaitent réviser ou progresser de manière autonome;
- des élèves mineurs, obligatoirement rattachés à un compte parent vérifié;
- des parents qui supervisent les progrès de leurs enfants.

L'architecture, bien que limitée au grand public dans cette première version, est conçue dès le départ pour accueillir ultérieurement une extension scolaire B2B sans refonte du socle technique ni du modèle de données.

## 2. Objectifs produit

La plateforme poursuit cinq objectifs :

- **Structuration** : progression par niveau, matière, compétence, cours et leçon, alignée sur la Progression des Apprentissages du MEQ.
- **Activité** : exercices interactifs et quiz à la fin de chaque leçon.
- **Engagement** : système de points, badges, niveaux et objectifs hebdomadaires.
- **Autonomie** : expérience d'apprentissage fluide, personnalisable, utilisable sans intervention extérieure.
- **Confiance parentale** : mécanisme de consentement vérifiable et outils de supervision pour les parents d'enfants mineurs.

## 3. Périmètre

### 3.1 Territoire

La plateforme est limitée au Québec. Les contenus, la terminologie et la localisation linguistique sont alignés sur le contexte québécois. Le modèle de données est conçu pour permettre une extension canadienne ultérieure.

### 3.2 Langues

L'ensemble de l'application est disponible nativement en français et en anglais : interface, navigation, notifications, contenus système, messages d'erreur, courriels transactionnels et contenus pédagogiques.

### 3.3 Public cible

- Élèves du Primaire 3 au Secondaire 5, rattachés à un parent si mineurs.
- Apprenants adultes indépendants.
- Parents superviseurs.

Les rôles école (enseignant, admin école, super admin école) sont explicitement **hors périmètre** de cette première version.

## 4. Parcours utilisateur

### 4.1 Parcours apprenant adulte

1. Création de compte avec vérification de courriel.
2. Onboarding : choix du niveau scolaire, des matières, de la langue.
3. Accès au catalogue et choix d'une matière, d'un cours, d'une leçon.
4. Étude du contenu de la leçon.
5. Pratique via les exercices ou évaluation via le quiz.
6. Consultation de la progression et déblocage de récompenses.

### 4.2 Parcours apprenant mineur

1. Le parent crée d'abord son compte et génère un code de rattachement.
2. Le mineur crée son compte et saisit le code.
3. Le parent confirme le rattachement par courriel.
4. Le mineur accède au catalogue avec les paramètres de supervision définis par le parent.
5. Toute activité est visible par le parent.

### 4.3 Parcours parent

1. Création de compte avec vérification de courriel.
2. Rattachement d'un ou plusieurs enfants mineurs via code à 6 chiffres.
3. Consultation des progrès de chaque enfant.
4. Gestion des paramètres de supervision, du consentement et de la confidentialité.
5. Accès aux rapports hebdomadaires et mensuels.

## 5. Structure pédagogique

La hiérarchie de contenu est :

**Niveau scolaire → Matière → Compétence → Cours → Leçon → Activité**

L'entité **Compétence**, alignée sur la Progression des Apprentissages du MEQ, permet de suivre la maîtrise réelle d'une notion, indépendamment de la leçon qui la couvre. Une compétence peut être travaillée dans plusieurs leçons, et une leçon peut couvrir plusieurs compétences.

Une activité est de type Exercice ou Quiz.

## 6. Niveaux et matières

### 6.1 Niveaux

- Primaire 3 à Primaire 6.
- Secondaire 1 à Secondaire 5.

### 6.2 Matières (alignement Alloprof)

- Mathématiques
- Français
- Anglais
- Sciences et technologies
- Chimie (Secondaire 4-5)
- Physique (Secondaire 4-5)
- Histoire
- Géographie
- Monde contemporain (Secondaire 5)
- Éducation financière (Secondaire 5)

Toutes les matières sont localisées FR/EN.

## 7. Structure du contenu

### 7.1 Entités principales

- User, ParentChildLink (états : pending, verified, revoked), ConsentRecord
- Subject, Skill, Course, Lesson, LessonSkillLink
- Activity, Exercise, Quiz, QuizQuestion, QuizAnswer
- Attempt (tentative horodatée, conservée sans écrasement)
- Result, Progress (par compétence)
- Reward, Badge
- AuditLog, ContentVersion

### 7.2 Règles

- Une leçon est liée à un cours et à une ou plusieurs compétences.
- Chaque tentative est horodatée, unique et conservée.
- Chaque élément est localisable FR/EN.
- Les contenus sont versionnés, publiables et archivables.

### 7.3 Contenu de leçon

Texte explicatif, images, audio, vidéo embarquée, exemples, résumé, objectifs pédagogiques, durée estimée, prérequis, mots-clés, compétences ciblées.

## 8. Exercices et quiz

### 8.1 Six types d'exercices retenus

- QCM (choix multiples, une ou plusieurs bonnes réponses)
- Vrai/Faux
- Texte à trous
- Association (relier deux colonnes)
- Remise en ordre
- Réponse courte (numérique ou mot-clé)

Les exercices offrent un retour immédiat et peuvent être notés ou non.

### 8.2 Quiz

Chaque leçon peut proposer un quiz associé. Le quiz contient des QCM, calcule un score, enregistre une tentative horodatée et alimente le système de récompenses.

## 9. Modes de jeu

**Mode solo uniquement** en Partie 1. L'utilisateur choisit niveau, matière, cours, leçon, puis lance les exercices ou le quiz. Les modes multi-joueurs sont reportés à la Partie 2.

## 10. Système de points et récompenses

Gamification incluant points par bonne réponse, bonus de rapidité et de série, badges de progression liés aux compétences, niveaux de joueur, trophées par matière, objectifs hebdomadaires et récompenses visuelles. Les récompenses encouragent l'apprentissage régulier, pas la compétition.

## 11. Consentement parental et mineurs

Mécanisme vérifiable et traçable :

1. Le parent crée son compte et vérifie son courriel.
2. Un code unique à 6 chiffres est généré, valable 24 h.
3. L'enfant saisit ce code; le rattachement passe à l'état `pending`.
4. Le parent confirme via un lien reçu par courriel; l'état passe à `verified`.
5. Chaque action est inscrite dans le journal `ConsentRecord` avec horodatage, IP, user-agent.

**Contrôles parentaux** : consentement explicite, supervision de l'activité, historique accessible, droit à l'effacement et à l'export des données.

**Conformité légale** : Loi 25 du Québec, LPRPDE fédérale, et COPPA pour usagers hors Canada. La Loi 25 impose la désignation d'un RPRP, la notification d'incident, et des politiques d'accès et de rectification accessibles.

## 12. Sécurité et protection des données

- Chaque requête vérifie rôle, identité et permissions réelles.
- Row Level Security Postgres pour cloisonner les données famille par famille.
- Journalisation immuable des connexions, consultations de résultats, actions sensibles et consentements.
- Chiffrement au repos (pgcrypto) et en transit (TLS 1.3).
- Sauvegardes quotidiennes automatiques avec externalisation.

## 13. Règles métier principales

- Un apprenant libre adulte accède à tous les contenus publics.
- Un mineur n'accède qu'après rattachement parental vérifié.
- Un parent ne voit que ses enfants rattachés.
- Chaque tentative est conservée et horodatée.
- Tous les contenus sont localisables FR/EN et versionnés.
- Les données mineures sont limitées au strict nécessaire.

## 14. Écrans de la Partie 1

Inventaire détaillé disponible dans `docs/05-screens-inventory.md`. Total : **122 écrans** regroupés en 14 zones fonctionnelles.

## 15. Stack technique

Détail complet dans `docs/02-stack-proxmox.md`. Résumé :

- Monorepo Turborepo + pnpm, TypeScript strict.
- Web : Next.js 14 App Router + Tailwind + shadcn/ui.
- Mobile : Expo SDK 50+ avec Expo Router + NativeWind.
- Backend : PostgreSQL 16 + Prisma + Auth.js v5 + Row Level Security.
- Hébergement : Proxmox personnel avec Docker, Traefik, Cloudflare en front.
- Stockage : MinIO S3-compatible.
- Emails : Resend API (externe).
- CI/CD : GitHub Actions + déploiement SSH.

## 16. Sources de contenu pédagogique

### 16.1 Rédactionnel

- **Progression des Apprentissages du MEQ** : référentiel officiel public, source de vérité pour la structure.
- **École ouverte** (MEQ + Université de Montréal) : contenus primaire et secondaire.
- **Répertoires de révision publics d'Alloprof** : alignement terminologique.
- **OER Commons**, **MERLOT**, **OpenStax** : ressources éducatives libres sous Creative Commons.

### 16.2 APIs gratuites

- **Open Trivia Database** : API JSON gratuite sans clé, licence CC BY-SA 4.0, 4 000+ QCM.
- **Free Dictionary API** : définitions et phonétique pour exercices de vocabulaire.
- **Numbers API** : faits mathématiques.

### 16.3 Génération assistée

- **Anthropic Claude API** : génération d'exercices et de quiz à partir de plans de leçon, avec révision humaine systématique.

### 16.4 Médias

- Unsplash, Pexels, Openclipart, SVGRepo, Freesound.
- Embed YouTube pour les vidéos pédagogiques existantes.

### 16.5 Gouvernance

Chaque ressource est associée à sa source et sa licence dans un registre interne. Toute production IA est relue par un humain avant publication. L'alignement MEQ est vérifié leçon par leçon.

## 17. Conformité légale (Partie 1)

- **Loi 25 du Québec** : désignation d'un RPRP, registre des incidents, politique de confidentialité accessible, mécanismes d'accès, rectification et suppression opérationnels.
- **LPRPDE** : consentement éclairé, finalité explicite, sécurité proportionnelle.
- **COPPA** : applicable aux utilisateurs hors Canada de moins de 13 ans.
- **Accessibilité** : cible WCAG 2.1 niveau AA.

Un budget de 3 000 à 5 000 $ CAD est à prévoir pour consultation juridique et rédaction des politiques avant lancement public.

## 18. Modèle économique

- **Freemium** : accès à un sous-ensemble de leçons et d'exercices gratuitement.
- **Plan Individuel** : accès complet pour un apprenant adulte.
- **Plan Famille** : jusqu'à 4 enfants rattachés à un parent, accès complet pour tous.

La tarification exacte est à déterminer selon l'étude de marché. Les coûts d'infrastructure à faible volume sont maîtrisés grâce à l'hébergement Proxmox personnel, ce qui permet une marge brute confortable dès les premiers clients payants.

## 19. Conditions de succès du lancement

- Un catalogue initial minimal viable sur 2 matières (Mathématiques et Français) et 2 niveaux (Secondaire 1 et 2), soit environ 60 leçons et 600 activités.
- Le mécanisme de consentement parental opérationnel et validé juridiquement.
- Les politiques de confidentialité, de consentement et les CGU rédigées.
- Les pages d'accès, rectification, suppression et export fonctionnelles (Loi 25).
- Une couverture d'accessibilité WCAG AA vérifiée sur les parcours critiques.
- Un déploiement mobile passant la revue Apple et Google.

## 20. Extensibilité vers la Partie 2 (école)

Le modèle de données et l'architecture sont conçus pour permettre l'ajout futur des rôles école (enseignant, admin école, super admin école) et des fonctionnalités associées (classes, assignations, sessions temps réel) sans refonte. La Partie 2 sera développée dans une itération ultérieure après validation du marché grand public.

Fichier 2 — docs/01-architecture.md
markdown# Architecture technique

> **Statut** : à compléter par Cowork lors de la Phase 0.

## Livrables attendus en Phase 0

1. Diagramme Mermaid de l'architecture système complète (Proxmox, containers, services, flux réseau).
2. Description textuelle de chaque composant et de ses responsabilités.
3. Flux d'authentification détaillé.
4. Flux de requête type (ex : soumission d'un quiz, du clic utilisateur à la persistance en base).
5. Flux de consentement parental avec séquence Mermaid.
6. Plan de sauvegarde et de reprise.
7. Liste des variables d'environnement requises (référence vers `.env.example`).

## Contenu à produire

Cowork doit remplir ce document au fil du développement et le tenir à jour comme source unique de vérité architecturale.

Fichier 3 — docs/02-stack-proxmox.md
markdown# Stack technique et hébergement Proxmox

## Correspondance cloud → self-hosted

Le projet est hébergé sur un serveur Proxmox personnel. Tous les services cloud ont été remplacés par leurs équivalents self-hosted open source, à l'exception des services pour lesquels l'auto-hébergement pose plus de risques que de bénéfices (emails transactionnels notamment, à cause de la gestion de la réputation IP).

| Couche | Alternative cloud | Choix retenu (Proxmox) |
|---|---|---|
| Base de données | Supabase cloud | **PostgreSQL 16** dans LXC ou VM dédié |
| Auth + API | Supabase Auth | **Auth.js v5 (NextAuth)** intégré à Next.js |
| Stockage objet | Cloudflare R2 | **MinIO** (S3-compatible, open source) |
| CDN et DNS | Cloudflare payant | **Cloudflare tier gratuit** en front (DNS + CDN + WAF) |
| Hébergement web | Vercel | **Docker** + **Traefik v3** (reverse proxy + SSL Let's Encrypt auto) |
| Edge functions | Vercel Edge | **Next.js API routes** et Server Actions |
| Emails transactionnels | — | **Resend API** (tier gratuit 3000/mois) — trop risqué à self-hoster |
| Monitoring erreurs | Sentry cloud | **Sentry self-hosted** OU **GlitchTip** (alternative légère) |
| Analytics produit | PostHog cloud | **PostHog self-hosted** OU **Plausible CE** |
| Logs centralisés | Logtail | **Grafana Loki** + **Grafana** |
| Uptime | Better Stack | **Uptime Kuma** (open source, ultra léger) |
| CI/CD | Vercel | **GitHub Actions** (gratuit) + runner self-hosted optionnel |
| Sauvegardes DB | Auto cloud | **pgBackRest** + stockage externe Backblaze B2 |
| Reverse proxy | Vercel edge | **Traefik v3** avec SSL automatique |
| Orchestration | — | **Docker Compose** (Kubernetes non justifié à ce stade) |

## Architecture Proxmox recommandée

### Découpage en LXC / VMs

| Container | Rôle | Ressources estimées |
|---|---|---|
| `eduquiz-db` | PostgreSQL 16 principal | 4 vCPU, 8 Go RAM, 100 Go SSD |
| `eduquiz-app` | Docker host (web, API, workers) | 6 vCPU, 12 Go RAM, 50 Go SSD |
| `eduquiz-storage` | MinIO + Redis (cache, rate limit) | 2 vCPU, 4 Go RAM, 200 Go SSD |
| `eduquiz-proxy` | Traefik + certificats | 1 vCPU, 1 Go RAM, 10 Go SSD |
| `eduquiz-monitoring` | GlitchTip + Grafana + Loki + Uptime Kuma | 2 vCPU, 4 Go RAM, 50 Go SSD |
| `eduquiz-backup` | Agent pgBackRest + rsync | 1 vCPU, 1 Go RAM, 500 Go HDD |

Les ressources peuvent être ajustées selon le serveur physique disponible.

### Flux réseau

```
Internet
   │
   ▼
Cloudflare (DNS + CDN + WAF + anti-DDoS)
   │
   ▼
Box / Routeur domestique (NAT + port 443)
   │
   ▼
Proxmox host (pare-feu pfSense ou équivalent)
   │
   ▼
eduquiz-proxy (Traefik) ──► services internes
                                │
                        ┌───────┼───────┐
                        ▼       ▼       ▼
                     eduquiz-app  db  storage
```

### Cloudflare devant

Cloudflare tier gratuit est obligatoire pour :
- Masquer l'IP domestique réelle (proxy orange cloud).
- Fournir le WAF de base.
- Absorber les tentatives DDoS de base.
- Servir les assets statiques depuis le CDN.

## Stack applicative détaillée

### Monorepo et langages

- **Turborepo** + **pnpm workspaces** pour orchestration
- **TypeScript strict mode** partout
- Structure :
  - `apps/web` — Next.js 14
  - `apps/mobile` — Expo SDK 50+
  - `packages/ui` — composants React partagés
  - `packages/db` — schéma Prisma et client
  - `packages/config` — configs ESLint, Prettier, TS partagées
  - `packages/i18n` — fichiers de traduction FR/EN
  - `packages/types` — types partagés
  - `packages/utils` — utilitaires purs

### Frontend web

- **Next.js 14** App Router + React Server Components + Server Actions
- **Tailwind CSS** + **shadcn/ui** (composants copiés dans le repo, pas dépendance npm)
- **TanStack Query** pour l'état serveur
- **Zustand** pour l'état client
- **React Hook Form** + **Zod** pour les formulaires
- **next-intl** pour i18n FR/EN

### Frontend mobile

- **Expo SDK 50+** avec **Expo Router**
- **NativeWind** pour styles Tailwind partagés web/mobile
- Même stack de données (TanStack Query, Zustand) pour réutilisation
- **i18next** + **react-i18next**
- Build et distribution via **EAS Build** (tier gratuit 30 builds/mois)

### Backend

- **PostgreSQL 16** dans LXC Proxmox
- **Prisma ORM** avec schéma unique dans `packages/db`
- API via **Next.js Route Handlers** et **Server Actions** typées
- **Auth.js v5 (NextAuth)** en mode JWT, session persistée en DB
- **Row Level Security Postgres** pour l'isolation des familles
- **Validation Zod** systématique sur toutes les entrées

### Sécurité

- **Argon2id** pour le hash des mots de passe
- **Rate limiting** sur auth et endpoints sensibles via **Redis** (local)
- **CSRF protection** sur toutes les mutations
- Headers sécurité stricts : CSP, HSTS, X-Frame-Options, Referrer-Policy
- Secrets uniquement via variables d'environnement
- **Dependabot** actif sur le dépôt GitHub

### Qualité et tests

- **ESLint** + **Prettier** configurés dans `packages/config`
- **Vitest** pour tests unitaires
- **Playwright** pour tests E2E web
- **Maestro** pour tests E2E mobile
- **Husky** + **lint-staged** pour pre-commit hooks
- **Conventional Commits** obligatoires
- Couverture minimale visée : 70 % sur la logique métier

### Design et accessibilité

- **Figma** (tier gratuit) pour les maquettes
- **Lucide** pour les icônes (open source)
- **Google Fonts** self-hostées via `next/font`
- Cible **WCAG 2.1 niveau AA** sur les parcours critiques
- Mode sombre obligatoire
- Paramètres utilisateur : taille de police, contraste, OpenDyslexic optionnelle

### Observabilité

- **GlitchTip** (ou Sentry self-hosted) pour les erreurs
- **PostHog self-hosted** ou **Plausible CE** pour l'analytics produit
- **Grafana Loki** pour les logs centralisés
- **Uptime Kuma** pour le monitoring de disponibilité

### Gestion de projet

- **Git** + **GitHub** (dépôt privé, gratuit)
- **GitHub Actions** pour CI/CD
- **Linear** ou **GitHub Projects** pour le backlog
- **Notion** ou Markdown dans le dépôt pour la doc interne

## Sauvegardes

### Stratégie 3-2-1 adaptée

- **Snapshots Proxmox quotidiens** sur le host (rétention 7 jours).
- **Dumps PostgreSQL** via pgBackRest, chiffrés, externalisés vers **Backblaze B2** (environ 0,005 $/Go/mois) — rétention 30 jours.
- **Dumps hebdomadaires complets** archivés vers un disque externe physique (rétention 12 mois).

Ne jamais avoir les backups uniquement sur le même hôte physique.

## Dépendances externes minimales

| Service | Usage | Coût |
|---|---|---|
| Cloudflare | DNS, CDN, WAF, SSL edge | Gratuit |
| Resend | Emails transactionnels | Gratuit jusqu'à 3000/mois |
| Backblaze B2 | Stockage de sauvegardes externalisées | ~0,005 $/Go/mois |
| Stripe | Paiements | 2,9 % + 0,30 $ par transaction |
| Apple Developer | Publication iOS | 99 USD/an |
| Google Play | Publication Android | 25 USD une fois |
| Nom de domaine | .com ou .ca | ~15 à 20 $/an |

**Coût récurrent mensuel estimé à faible volume** : moins de 20 $ CAD hors frais Stripe et hors électricité Proxmox.

## Livrables Phase 0 pour cette section

Cowork doit produire :

1. Un `docker-compose.yml` de développement local incluant PostgreSQL, MinIO, Traefik, Redis.
2. Un `docker-compose.prod.yml` pour le déploiement Proxmox.
3. Un fichier `.env.example` documentant toutes les variables requises.
4. Un guide `docs/infrastructure/proxmox-setup.md` expliquant la création des LXC, l'installation des services et la configuration Cloudflare.
5. Les workflows GitHub Actions pour build et déploiement automatique.

Fichier 4 — docs/05-screens-inventory.md
markdown# Inventaire des écrans — EduQuiz Public (Partie 1)

**Total : 122 écrans** regroupés en 14 zones fonctionnelles.

## Zone 1 — Écrans publics (non authentifiés) — 14 écrans

1. Accueil / Landing
2. À propos
3. Fonctionnalités
4. Tarifs
5. Pour les parents
6. Blog / Ressources
7. Article de blog
8. FAQ
9. Contact
10. Politique de confidentialité (Loi 25)
11. Conditions d'utilisation
12. Politique de consentement parental
13. Mentions légales
14. Pages techniques : 404, 500, maintenance (regroupées logiquement)

## Zone 2 — Authentification et onboarding — 14 écrans

15. Sélecteur de type de compte (adulte / parent / mineur)
16. Connexion
17. Mot de passe oublié
18. Réinitialisation de mot de passe
19. Inscription apprenant adulte
20. Inscription parent
21. Inscription mineur (avec demande de rattachement)
22. Vérification de courriel (écran d'attente)
23. Courriel vérifié
24. Onboarding étape 1 — niveau scolaire
25. Onboarding étape 2 — matières d'intérêt
26. Onboarding étape 3 — langue et préférences
27. Onboarding étape 4 — tutoriel interactif
28. Écran de consentement parental en attente

## Zone 3 — Compte et paramètres — 10 écrans

29. Profil utilisateur
30. Édition du profil
31. Avatar et personnalisation
32. Paramètres du compte (email, mot de passe)
33. Paramètres de langue
34. Paramètres de notifications
35. Paramètres de confidentialité
36. Paramètres d'accessibilité (taille police, contraste, dyslexie)
37. Export de mes données (Loi 25)
38. Suppression du compte avec confirmation

## Zone 4 — Navigation et contenu — 14 écrans

39. Tableau de bord personnel
40. Catalogue des matières
41. Détail d'une matière
42. Liste des cours filtrables
43. Détail d'un cours
44. Liste des leçons d'un cours
45. Détail et lecteur de leçon
46. Lecteur vidéo intégré (avec sous-titres FR/EN)
47. Lecteur audio intégré
48. Glossaire / mots-clés
49. Résumé de leçon
50. Recherche globale
51. Résultats de recherche
52. Favoris / marque-pages

## Zone 5 — Compétences MEQ — 4 écrans

53. Carte des compétences par matière
54. Détail d'une compétence
55. Mon niveau de maîtrise
56. Compétences à consolider (recommandations)

## Zone 6 — Exercices — 13 écrans

57. Écran de lancement d'exercice
58. Exercice QCM
59. Exercice Vrai/Faux
60. Exercice Texte à trous
61. Exercice Association
62. Exercice Remise en ordre
63. Exercice Réponse courte
64. Feedback immédiat
65. Pause / reprise d'exercice
66. Abandon avec confirmation
67. Résultat d'exercice
68. Correction détaillée
69. Recommandations post-exercice

## Zone 7 — Quiz — 7 écrans

70. Lancement de quiz
71. Question de quiz
72. Transition entre questions
73. Pause quiz
74. Résultat de quiz
75. Correction complète
76. Comparaison avec tentatives précédentes

## Zone 8 — Suivi et progression — 6 écrans

77. Ma progression globale
78. Progression par matière
79. Progression par compétence
80. Historique d'activités
81. Détail d'une tentative
82. Statistiques personnelles

## Zone 9 — Gamification — 6 écrans

83. Mon niveau et XP
84. Collection de badges
85. Détail d'un badge
86. Liste des trophées
87. Objectifs hebdomadaires
88. Animation de déblocage (overlay)

## Zone 10 — Dashboard parent — 9 écrans

89. Tableau de bord parent
90. Liste des enfants rattachés
91. Rattacher un nouvel enfant (génération de code)
92. Détail d'un enfant (progression)
93. Progression par matière de l'enfant
94. Historique d'activités de l'enfant
95. Rapport hebdomadaire ou mensuel
96. Paramètres de supervision par enfant
97. Révoquer un rattachement

## Zone 11 — Notifications et support — 4 écrans

98. Centre de notifications
99. Aide et base de connaissances
100. Soumettre une demande de support
101. Confirmation d'envoi

## Zone 12 — Paiement et abonnement — 10 écrans

102. Page de tarifs (connecté)
103. Choix du plan
104. Saisie des informations de paiement
105. Confirmation de commande
106. Paiement réussi
107. Paiement échoué
108. Mon abonnement
109. Historique de facturation
110. Changer de plan
111. Annuler l'abonnement

## Zone 13 — Écrans système — 6 écrans

112. Splash mobile
113. Premier lancement (demande de permissions)
114. Mise à jour disponible (mobile)
115. Modal cookies (web)
116. Bannière d'installation PWA
117. Mode hors ligne minimal (message d'information)

## Zone 14 — Modales transverses — 5 écrans

118. Confirmation d'action destructive
119. Modal de partage de résultat
120. Modal d'invitation (parent vers enfant)
121. Modal de changement de niveau
122. Overlay tutoriel contextuel

## Récapitulatif

| Zone | Nombre d'écrans |
|---|---|
| 1. Publics | 14 |
| 2. Auth et onboarding | 14 |
| 3. Compte et paramètres | 10 |
| 4. Navigation et contenu | 14 |
| 5. Compétences MEQ | 4 |
| 6. Exercices | 13 |
| 7. Quiz | 7 |
| 8. Suivi et progression | 6 |
| 9. Gamification | 6 |
| 10. Dashboard parent | 9 |
| 11. Notifications et support | 4 |
| 12. Paiement et abonnement | 10 |
| 13. Écrans système | 6 |
| 14. Modales transverses | 5 |
| **Total** | **122** |

## Principes transversaux applicables à tous les écrans

**Responsive** : chaque écran a une version mobile (320-480px), tablette (768px), desktop (1024px+).

**États obligatoires pour chaque écran** : vide (empty state avec CTA), chargement (skeleton screens), erreur (avec action de récupération), succès.

**Hiérarchie typographique** : titre principal (H1, 32px), titres de section (H2, 24px), sous-titres (H3, 18px), corps (16px), secondaire (14px), métadonnées (12px).

**Système de couleurs** : primaire (action CTA), secondaire (actions alternatives), succès (vert), erreur (rouge), avertissement (jaune), info (bleu). Mode sombre obligatoire.

**Accessibilité** : contraste AA minimum, focus visible au clavier, labels ARIA, navigation logique.

**Bilinguisme** : tout texte a son pendant FR/EN, avec gestion des longueurs différentes.

**Feedback utilisateur** : toute action déclenche un feedback (toast, changement d'état, transition).

Les wireframes textuels détaillés sont dans `docs/06-wireframes.md`.

Fichier 5 — docs/06-wireframes.md
markdown# Wireframes textuels — EduQuiz Public

Les wireframes décrivent la structure, la hiérarchie visuelle et les interactions clés. Ils servent de base à la conception Figma, pas de spécification pixel-perfect.

**Notation utilisée :**
- `[BLOC]` = section visuelle
- `→` = action / navigation
- `(attr)` = propriété ou état
- `———` = séparateur visuel

---

## Zone 1 — Vitrine publique

### Écran 1 — Accueil / Landing

```
┌─ HEADER ─────────────────────────────────────────┐
│ [Logo EduQuiz] [Matières▾] [Parents] [Tarifs]    │
│                         [Connexion] [S'inscrire] │
│                                   [FR|EN] [🌙]    │
└──────────────────────────────────────────────────┘

┌─ HERO ───────────────────────────────────────────┐
│                                                  │
│   Apprendre au rythme du Québec                  │
│   De la 3ᵉ année à la 5ᵉ secondaire              │
│                                                  │
│   [Essai gratuit →]  [Démo vidéo ▶]              │
│                                                  │
│         [Illustration : élève + parent]          │
└──────────────────────────────────────────────────┘

┌─ PROOF BAND ─────────────────────────────────────┐
│ "Aligné sur la Progression des Apprentissages    │
│  du MEQ" · Bilingue · Conforme Loi 25            │
└──────────────────────────────────────────────────┘

┌─ 3 BÉNÉFICES (cartes) ───────────────────────────┐
│ [📚 Leçons]   [🎯 Exercices]   [🏆 Progression]  │
│  structurées   interactifs      par compétence   │
└──────────────────────────────────────────────────┘

┌─ MATIÈRES (carrousel) ───────────────────────────┐
│ [Math] [Français] [Anglais] [Sciences] [→]       │
└──────────────────────────────────────────────────┘

┌─ POUR QUI ? (3 colonnes) ────────────────────────┐
│ [Apprenant]    [Parent]       [Enfant]           │
│  autonome       superviseur    rattaché          │
│  [En savoir +] [En savoir +]  [En savoir +]      │
└──────────────────────────────────────────────────┘

┌─ TÉMOIGNAGES (slider) ───────────────────────────┐

┌─ CTA FINAL ──────────────────────────────────────┐
│  Prêt à commencer ?                              │
│  [Créer un compte gratuit →]                     │
└──────────────────────────────────────────────────┘

┌─ FOOTER ─────────────────────────────────────────┐
│ Colonnes : Produit · Entreprise · Légal · Contact│
│ Réseaux sociaux · FR|EN · © 2026 EduQuiz         │
└──────────────────────────────────────────────────┘
```

### Écran 4 — Tarifs

```
┌─ HEADER ─────────────────────────────────────────┐

┌─ TITRE ──────────────────────────────────────────┐
│ Des formules simples, sans surprise              │
│ [Mensuel | Annuel (−20%)]  toggle                │
└──────────────────────────────────────────────────┘

┌─ 3 CARTES PLANS ─────────────────────────────────┐
│ GRATUIT        INDIVIDUEL ★      FAMILLE         │
│ 0 $            12 $/mois         25 $/mois       │
│                                                  │
│ ✓ 3 leçons/mois ✓ Accès complet  ✓ 4 enfants     │
│ ✓ Quiz limités  ✓ Toutes matières ✓ Tout inclus  │
│ ✗ Parent        ✓ Progression     ✓ Dashboard    │
│ ✗ Hors ligne    ✓ Récompenses     parent         │
│                                                  │
│ [Commencer]    [Choisir Indiv.]  [Choisir Fam.]  │
└──────────────────────────────────────────────────┘

┌─ TABLEAU COMPARATIF DÉTAILLÉ ────────────────────┐

┌─ FAQ PAIEMENT ───────────────────────────────────┐
│ ▾ Puis-je annuler à tout moment ?                │
│ ▾ Les taxes TPS/TVQ sont-elles incluses ?        │
│ ▾ Y a-t-il un essai gratuit ?                    │
└──────────────────────────────────────────────────┘

┌─ CTA + FOOTER ───────────────────────────────────┐
```

---

## Zone 2 — Authentification et onboarding

### Écran 15 — Sélecteur de type de compte

```
┌─ HEADER SIMPLE ──────────────────────────────────┐
│ [Logo] ← Retour                        [FR|EN]   │
└──────────────────────────────────────────────────┘

┌─ CENTRE DE PAGE ─────────────────────────────────┐
│                                                  │
│   Quel type de compte souhaitez-vous créer ?     │
│                                                  │
│   ┌──────────────┐  ┌──────────────┐             │
│   │ 🧑 Adulte    │  │ 👨‍👩‍👧 Parent   │             │
│   │ J'apprends   │  │ Je supervise │             │
│   │ pour moi     │  │ mon enfant   │             │
│   │ [Choisir →]  │  │ [Choisir →]  │             │
│   └──────────────┘  └──────────────┘             │
│                                                  │
│   ┌──────────────┐                               │
│   │ 🧒 Mineur    │                               │
│   │ J'ai un code │                               │
│   │ de rattach.  │                               │
│   │ [Choisir →]  │                               │
│   └──────────────┘                               │
│                                                  │
│   Déjà un compte ? [Se connecter]                │
└──────────────────────────────────────────────────┘
```

### Écran 19 — Inscription apprenant adulte

```
┌─ HEADER SIMPLE ──────────────────────────────────┐

┌─ FORMULAIRE (max-width 480px, centré) ───────────┐
│ Créer un compte                                  │
│                                                  │
│ Courriel                                         │
│ [_______________________________]                │
│                                                  │
│ Mot de passe                                     │
│ [_______________________________] 👁              │
│ · 8 caractères min · 1 chiffre · 1 majuscule     │
│                                                  │
│ Date de naissance (vérification majorité)        │
│ [JJ/MM/AAAA]                                     │
│                                                  │
│ ☐ J'ai lu et j'accepte les [CGU] et la           │
│   [Politique de confidentialité]                 │
│                                                  │
│ ☐ J'accepte de recevoir les nouveautés (option.) │
│                                                  │
│ [Créer mon compte]  (bouton principal)           │
│                                                  │
│ ─── ou ───                                       │
│ [G] Continuer avec Google                        │
│ [] Continuer avec Apple                         │
│                                                  │
│ Déjà inscrit ? [Se connecter]                    │
└──────────────────────────────────────────────────┘
```

### Écran 21 — Inscription mineur (demande de rattachement)

```
┌─ HEADER SIMPLE ──────────────────────────────────┐

┌─ FORMULAIRE ─────────────────────────────────────┐
│ Créer mon compte (mineur)                        │
│                                                  │
│ ⚠ Info : Tu as besoin du code de ton parent.     │
│   Demande-lui de créer son compte en premier.    │
│                                                  │
│ Prénom (facultatif)                              │
│ [_______________________________]                │
│                                                  │
│ Code de rattachement (6 chiffres)                │
│ [_][_][_][_][_][_]                               │
│                                                  │
│ Mot de passe (choisi par le parent recommandé)   │
│ [_______________________________]                │
│                                                  │
│ ☐ J'ai vu la [version simplifiée des règles]     │
│                                                  │
│ [Créer mon compte et envoyer la demande]         │
│                                                  │
│ Pas encore de code ? [Demander à mon parent]     │
└──────────────────────────────────────────────────┘
```

### Écran 28 — Consentement parental en attente

```
┌─ HEADER AUTH ────────────────────────────────────┐

┌─ CONTENU CENTRAL ────────────────────────────────┐
│                                                  │
│         [Illustration enveloppe + horloge]       │
│                                                  │
│   En attente de confirmation                     │
│                                                  │
│   Ton parent a reçu un courriel pour valider     │
│   ton compte. Ça prend généralement quelques     │
│   minutes.                                       │
│                                                  │
│   Courriel envoyé à : p***@gmail.com             │
│                                                  │
│   [Renvoyer le courriel] (cooldown 60s)          │
│                                                  │
│   Problème ? [Contacter le support]              │
│                                                  │
│   [← Me déconnecter]                             │
└──────────────────────────────────────────────────┘
```

### Écrans 24-27 — Onboarding (4 étapes)

Pattern commun :

```
┌─ PROGRESS BAR ────────────────────────────────────┐
│ ●●○○  Étape 2 sur 4                    [Passer]  │
└──────────────────────────────────────────────────┘

┌─ ÉTAPE ──────────────────────────────────────────┐
│ Quel est ton niveau scolaire ?                   │
│                                                  │
│ [Grille de cartes sélectionnables]               │
│  ☐ Primaire 3   ☐ Primaire 4                     │
│  ☐ Primaire 5   ☐ Primaire 6                     │
│  ☐ Secondaire 1  ☐ Secondaire 2                  │
│  ☐ Secondaire 3  ☐ Secondaire 4                  │
│  ☐ Secondaire 5                                  │
│                                                  │
│ [← Retour]              [Continuer →]            │
└──────────────────────────────────────────────────┘
```

---

## Zone 3 — Compte et paramètres

### Écran 29 — Profil utilisateur

```
┌─ HEADER APP ─────────────────────────────────────┐
│ [≡] EduQuiz  [🔔3]  [🌐FR]  [Avatar ▾]           │
└──────────────────────────────────────────────────┘

┌─ SIDEBAR (desktop) ──┬─ CONTENU ─────────────────┐
│ 📊 Tableau de bord   │ Mon profil                │
│ 📚 Matières          │                           │
│ 🏆 Récompenses       │ [Avatar grand]            │
│ 📈 Progression       │ [Changer la photo]        │
│ ─────────            │                           │
│ ⚙ Paramètres ▸       │ Prénom : Paul             │
│   • Profil ●         │ Nom : Amouzou             │
│   • Compte           │ Pseudo : paul_a           │
│   • Notifications    │ Niveau : Secondaire 3     │
│   • Confidentialité  │ Langue : Français         │
│   • Accessibilité    │                           │
│ 🚪 Déconnexion       │ [Modifier mes infos]      │
└──────────────────────┴───────────────────────────┘
```

### Écran 37 — Export de mes données (Loi 25)

```
┌─ CONTENU ────────────────────────────────────────┐
│ Export de mes données personnelles               │
│                                                  │
│ Conformément à la Loi 25 du Québec, vous pouvez  │
│ obtenir une copie de toutes vos données.         │
│                                                  │
│ L'export inclut :                                │
│ ✓ Informations de profil                         │
│ ✓ Historique d'activités et scores               │
│ ✓ Badges et récompenses                          │
│ ✓ Journal de consentements                       │
│ ✓ Données enfants rattachés (si parent)          │
│                                                  │
│ Format : [JSON ●] [PDF ○]                        │
│                                                  │
│ [Demander mon export]                            │
│                                                  │
│ ─── Exports précédents ───                       │
│ 📄 Export du 12/03/2026 (JSON)  [Télécharger]    │
│    Expire le 19/03/2026                          │
└──────────────────────────────────────────────────┘
```

### Écran 38 — Suppression du compte

```
┌─ CONTENU ────────────────────────────────────────┐
│ ⚠ Supprimer mon compte                           │
│                                                  │
│ Cette action supprimera :                        │
│ ✗ Votre profil et vos données                    │
│ ✗ Vos scores et progressions                     │
│ ✗ Vos badges et récompenses                      │
│                                                  │
│ Délai de grâce : 30 jours pour annuler.          │
│                                                  │
│ Certaines données sont conservées pour obligation│
│ légale (journal de consentement, 3 ans).         │
│                                                  │
│ Pour confirmer, tapez "SUPPRIMER" :              │
│ [_______________________________]                │
│                                                  │
│ Mot de passe actuel :                            │
│ [_______________________________]                │
│                                                  │
│ [Annuler]     [Supprimer définitivement]         │
└──────────────────────────────────────────────────┘
```

---

## Zone 4 — Navigation et contenu

### Écran 39 — Tableau de bord personnel (apprenant)

```
┌─ HEADER APP ─────────────────────────────────────┐

┌─ SIDEBAR ─┬─ CONTENU ─────────────────────────────┐
│ ...       │ 👋 Bonjour Paul !                    │
│           │                                      │
│           │ ┌─ REPRISE ─────────────────────────┐ │
│           │ │ Continuer où tu t'es arrêté       │ │
│           │ │ 📘 Fractions — Leçon 3            │ │
│           │ │ Progression : ████░░ 60%          │ │
│           │ │ [Reprendre →]                     │ │
│           │ └───────────────────────────────────┘ │
│           │                                      │
│           │ ┌─ OBJECTIF DE LA SEMAINE ──────────┐ │
│           │ │ 🎯 Compléter 3 leçons             │ │
│           │ │ ██████░░░░  2/3                   │ │
│           │ └───────────────────────────────────┘ │
│           │                                      │
│           │ ┌─ 3 CARTES RECOMMANDATIONS ───────┐ │
│           │ │ [Leçon]  [Leçon]  [Quiz]         │ │
│           │ └───────────────────────────────────┘ │
│           │                                      │
│           │ ┌─ STATS RAPIDES ───────────────────┐ │
│           │ │ 🏆 12 badges  ⭐ 1 240 XP         │ │
│           │ │ 📈 Niveau 8   🔥 Série : 5 jours  │ │
│           │ └───────────────────────────────────┘ │
└───────────┴──────────────────────────────────────┘
```

### Écran 40 — Catalogue des matières

```
┌─ EN-TÊTE DE PAGE ────────────────────────────────┐
│ Matières                                         │
│ Filtrer : [Niveau ▾] [Langue ▾]                  │
└──────────────────────────────────────────────────┘

┌─ GRILLE DE CARTES ───────────────────────────────┐
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐      │
│  │  ➕    │  │  📖   │  │  🔤   │  │  🔬   │      │
│  │ Math. │  │ Franç.│  │ Angl. │  │ Sc&T  │      │
│  │ 42 c. │  │ 38 c. │  │ 25 c. │  │ 30 c. │      │
│  │ ░███░░│  │ ░░░░░░│  │ ██░░░░│  │ ░░░░░░│      │
│  └───────┘  └───────┘  └───────┘  └───────┘      │
│                                                  │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐      │
│  │  ⚗    │  │  ⚛    │  │  🏛    │  │  🌍   │      │
│  │ Chimie│  │ Phys. │  │ Hist. │  │ Géo.  │      │
│  └───────┘  └───────┘  └───────┘  └───────┘      │
│                                                  │
│  ┌───────┐  ┌───────┐                            │
│  │  🗞    │  │  💰   │                            │
│  │ Monde │  │ Finan │                            │
│  └───────┘  └───────┘                            │
└──────────────────────────────────────────────────┘
```

### Écran 43 — Détail d'un cours

```
┌─ BREADCRUMB ─────────────────────────────────────┐
│ Matières > Mathématiques > Algèbre — Sec. 3      │
└──────────────────────────────────────────────────┘

┌─ HERO DU COURS ──────────────────────────────────┐
│ Algèbre de base                                  │
│ Secondaire 3 · 8 leçons · ~4h                    │
│                                                  │
│ Progression globale : ████░░░░░░ 40%             │
│                                                  │
│ [Reprendre la leçon 4 →]                         │
└──────────────────────────────────────────────────┘

┌─ COMPÉTENCES CIBLÉES ────────────────────────────┐
│ 🏅 Résoudre une équation du premier degré        │
│ 🏅 Manipuler des expressions algébriques         │
│ 🏅 Utiliser des variables dans un problème       │
└──────────────────────────────────────────────────┘

┌─ LISTE DES LEÇONS ───────────────────────────────┐
│ ✅ 1. Introduction aux variables      (15 min)   │
│ ✅ 2. Expressions algébriques         (20 min)   │
│ ✅ 3. Addition et soustraction        (25 min)   │
│ 🔵 4. Équations simples           ← EN COURS     │
│ ⚪ 5. Équations à deux variables      (30 min)   │
│ ⚪ 6. Problèmes concrets              (25 min)   │
│ ⚪ 7. Révision                        (15 min)   │
│ ⚪ 8. Quiz final                      (20 min)   │
└──────────────────────────────────────────────────┘
```

### Écran 45 — Détail et lecteur de leçon

```
┌─ BARRE SUPÉRIEURE ───────────────────────────────┐
│ [← Cours]  Leçon 4 : Équations simples    ☆ 🖨  │
│ Progression dans la leçon : ██░░░░░░ 25%         │
└──────────────────────────────────────────────────┘

┌─ 2 COLONNES (desktop) ───────────────────────────┐
│ ┌─ SOMMAIRE ─┐ ┌─ CONTENU ───────────────────┐   │
│ │ ● Intro    │ │ Section 1 : Qu'est-ce qu'une │   │
│ │ ○ Défin.   │ │ équation ?                   │   │
│ │ ○ Exemples │ │                              │   │
│ │ ○ Astuce   │ │ [Texte explicatif riche]     │   │
│ │ ○ Résumé   │ │                              │   │
│ │            │ │ [Image illustration]         │   │
│ │ 🎯 Compét. │ │                              │   │
│ │ liées :    │ │ 💡 Exemple :                 │   │
│ │ • Résoudre │ │    x + 3 = 7                 │   │
│ │   équation │ │                              │   │
│ │            │ │ [Vidéo embarquée ▶ 2:35]     │   │
│ └────────────┘ │                              │   │
│                │ [Audio narration 🔊]         │   │
│                └──────────────────────────────┘   │
└──────────────────────────────────────────────────┘

┌─ PIED DE LEÇON ──────────────────────────────────┐
│ [← Section préc.]    [Résumé]   [Section suiv. →]│
│                                                  │
│ ─── À la fin de la leçon ───                     │
│ [✏ Faire les exercices]  [🎯 Lancer le quiz]    │
└──────────────────────────────────────────────────┘
```

---

## Zone 5 — Compétences

### Écran 53 — Carte des compétences par matière

```
┌─ FILTRES ────────────────────────────────────────┐
│ Matière : [Mathématiques ▾]                      │
│ Niveau  : [Secondaire 3 ▾]                       │
└──────────────────────────────────────────────────┘

┌─ ARBRE DE COMPÉTENCES ───────────────────────────┐
│                                                  │
│   🌳 Algèbre                                     │
│   ├─ 🏅 Variables              ███████░░░ 75%    │
│   ├─ 🏅 Équations 1 degré      █████████░ 90%    │
│   ├─ ⚪ Équations 2 variables   ░░░░░░░░░░ 0%    │
│   └─ ⚪ Inéquations             ░░░░░░░░░░ 0%    │
│                                                  │
│   🌳 Géométrie                                   │
│   ├─ 🏅 Figures planes         ██████████ 100%   │
│   ├─ 🏅 Angles et mesures      ████░░░░░░ 40%    │
│   └─ ⚪ Théorème de Pythagore   ░░░░░░░░░░ 0%    │
│                                                  │
│   🌳 Arithmétique                                │
│   └─ ...                                         │
└──────────────────────────────────────────────────┘

Légende : 🏅 Maîtrisé  🔵 En cours  ⚪ À découvrir
```

### Écran 54 — Détail d'une compétence

```
┌─ EN-TÊTE ────────────────────────────────────────┐
│ 🏅 Résoudre une équation du premier degré        │
│ Secondaire 3 · Algèbre                           │
│                                                  │
│ Maîtrise : ████████░░ 80%                        │
│ (basé sur 12 tentatives sur 3 leçons)            │
└──────────────────────────────────────────────────┘

┌─ DESCRIPTION MEQ ────────────────────────────────┐
│ "L'élève est capable de résoudre une équation    │
│  linéaire à une inconnue en utilisant les        │
│  propriétés des opérations."                     │
└──────────────────────────────────────────────────┘

┌─ LEÇONS LIÉES ───────────────────────────────────┐
│ • Leçon 4 : Équations simples       ✅ Complétée │
│ • Leçon 5 : Équations à 2 variables ⚪ À faire   │
│ • Leçon 8 : Quiz final              ⚪ À faire   │
└──────────────────────────────────────────────────┘

┌─ ACTIVITÉS CIBLÉES ──────────────────────────────┐
│ [Exercices ciblés] [Quiz de vérification]        │
└──────────────────────────────────────────────────┘
```

---

## Zone 6 — Exercices

### Écran 57 — Lancement d'exercice

```
┌─ MODAL / PAGE DE LANCEMENT ──────────────────────┐
│                                                  │
│         [Illustration du type d'exercice]        │
│                                                  │
│   Exercice : Équations simples                   │
│   Type : QCM · 10 questions                      │
│   Durée estimée : 8 minutes                      │
│                                                  │
│   🎯 Compétence travaillée :                     │
│   Résoudre une équation du premier degré         │
│                                                  │
│   Instructions :                                 │
│   • Choisis la bonne réponse pour chaque         │
│     question                                     │
│   • Tu peux revenir en arrière                   │
│   • Le temps n'est pas limité                    │
│                                                  │
│   [← Annuler]              [Commencer →]         │
└──────────────────────────────────────────────────┘
```

### Écrans 58-63 — Les 6 types d'exercices (pattern unifié)

Structure commune :

```
┌─ BARRE DE PROGRESSION ───────────────────────────┐
│ Question 3 / 10       ██████░░░░  30%      [✕]  │
└──────────────────────────────────────────────────┘

┌─ ZONE QUESTION ──────────────────────────────────┐
│                                                  │
│   [Énoncé de la question]                        │
│   [Image ou formule éventuelle]                  │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ ZONE RÉPONSE (varie selon type) ────────────────┐
│                                                  │
│   [Composant spécifique au type]                 │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ PIED ───────────────────────────────────────────┐
│ [← Précédent]    [Indice 💡]        [Valider →] │
└──────────────────────────────────────────────────┘
```

**Variations par type :**

**QCM (écran 58)**
```
Zone réponse :
  ○ Option A : x = 3
  ● Option B : x = 4
  ○ Option C : x = 5
  ○ Option D : x = 6
```

**Vrai/Faux (écran 59)**
```
Zone réponse :
  [  ✓ VRAI  ]    [  ✗ FAUX  ]    (2 gros boutons)
```

**Texte à trous (écran 60)**
```
Zone réponse :
  "Si 2x + 3 = 11, alors x = [___] "
```

**Association (écran 61)**
```
Zone réponse (2 colonnes avec lignes à tracer) :
  Colonne A              Colonne B
  [x + 2 = 5]  ─────→    [x = 3]
  [2x = 8]               [x = 4]
  [x - 1 = 2]            [x = -1]
  [x + 4 = 3]            [x = 3]
```

**Remise en ordre (écran 62)**
```
Zone réponse (drag & drop) :
  Remets dans l'ordre les étapes :
  ┌─────────────────────────┐
  │ ⋮⋮ 1. Isoler x          │ ← glissable
  │ ⋮⋮ 2. Soustraire 3      │
  │ ⋮⋮ 3. Diviser par 2     │
  │ ⋮⋮ 4. Vérifier          │
  └─────────────────────────┘
```

**Réponse courte (écran 63)**
```
Zone réponse :
  Calcule la valeur de x :
  2x - 4 = 10
  
  x = [________]
  
  (La tolérance accepte 7 et "7")
```

### Écran 64 — Feedback immédiat

```
Variante CORRECT :
┌──────────────────────────────────────────────────┐
│  ✅  Excellent !                                 │
│                                                  │
│  Ta réponse : x = 4                              │
│  C'est la bonne réponse.                         │
│                                                  │
│  💡 Explication :                                │
│  Pour isoler x, on soustrait 3 des deux côtés,   │
│  puis on divise par 2.                           │
│                                                  │
│                              [Question suivante→]│
└──────────────────────────────────────────────────┘

Variante INCORRECT :
┌──────────────────────────────────────────────────┐
│  ❌  Pas tout à fait                             │
│                                                  │
│  Ta réponse : x = 3                              │
│  La bonne réponse : x = 4                        │
│                                                  │
│  💡 Explication : [...]                          │
│                                                  │
│  [Réessayer]              [Question suivante →]  │
└──────────────────────────────────────────────────┘
```

### Écran 67 — Résultat d'exercice

```
┌─ HERO RÉSULTAT ──────────────────────────────────┐
│         🎉  Exercice terminé !                   │
│                                                  │
│         Score : 8 / 10                           │
│         Temps : 6 min 42 s                       │
│                                                  │
│         [Jauge circulaire 80%]                   │
│                                                  │
│         +50 XP gagnés  🏅 1 nouveau badge        │
└──────────────────────────────────────────────────┘

┌─ RÉCAP QUESTIONS ────────────────────────────────┐
│ Q1 ✅  Q2 ✅  Q3 ❌  Q4 ✅  Q5 ✅                │
│ Q6 ✅  Q7 ❌  Q8 ✅  Q9 ✅  Q10 ✅               │
│ [Voir la correction détaillée →]                 │
└──────────────────────────────────────────────────┘

┌─ RECOMMANDATIONS ────────────────────────────────┐
│ Pour progresser :                                │
│ 📘 Revoir la section "Équations à 2 var."        │
│ ✏ Refaire l'exercice similaire                   │
│ 🎯 Tenter le quiz                                │
└──────────────────────────────────────────────────┘

┌─ ACTIONS ────────────────────────────────────────┐
│ [← Retour au cours]  [Refaire]  [Quiz final →]   │
└──────────────────────────────────────────────────┘
```

---

## Zone 7 — Quiz

### Écran 70 — Lancement de quiz

Identique à l'écran 57, avec mention supplémentaire :

```
⏱ Chronomètre : 15 minutes (visible pendant le quiz)
🏆 Récompense possible : 150 XP + badge "Algébriste"
```

### Écran 74 — Résultat de quiz

```
┌─ CÉLÉBRATION ────────────────────────────────────┐
│ [Animation confettis si score ≥ 80%]             │
│                                                  │
│          🏆  Quiz terminé !                      │
│                                                  │
│          9 / 10                                  │
│          Temps : 12:34                           │
│                                                  │
│          Rang personnel : #3 (meilleur : 10/10)  │
└──────────────────────────────────────────────────┘

┌─ PROGRESSION COMPÉTENCES ────────────────────────┐
│ Compétence "Équations 1er degré"                 │
│ Avant  : ██████░░░░ 60%                          │
│ Après  : █████████░ 90%  (+30%)                  │
└──────────────────────────────────────────────────┘

┌─ BADGES DÉBLOQUÉS ───────────────────────────────┐
│ 🏅 Algébriste débutant  (nouveau !)              │
└──────────────────────────────────────────────────┘

┌─ ACTIONS ────────────────────────────────────────┐
│ [Voir correction]  [Partager]  [Refaire]         │
│ [← Retour au cours]                              │
└──────────────────────────────────────────────────┘
```

---

## Zone 8 — Suivi et progression

### Écran 77 — Ma progression globale

```
┌─ EN-TÊTE ────────────────────────────────────────┐
│ Ma progression                                   │
│ Filtre : [Tout ▾] [7j ▾]                         │
└──────────────────────────────────────────────────┘

┌─ KPI EN HAUT ────────────────────────────────────┐
│ [📚 42 leçons]  [✏ 180 ex.]  [🏆 12 badges]     │
│ [⭐ 2 840 XP]   [🔥 série 5j] [⏱ 18h total]     │
└──────────────────────────────────────────────────┘

┌─ GRAPHIQUE ACTIVITÉ ─────────────────────────────┐
│  XP gagnés par jour (30 derniers jours)          │
│  ▂▄▆▃▅▇█▆▄▃▅▇▆▅▄▃▂▄▆▇                           │
└──────────────────────────────────────────────────┘

┌─ PAR MATIÈRE (barres) ───────────────────────────┐
│ Mathématiques  ██████░░░░ 60%                    │
│ Français       █████████░ 85%                    │
│ Sciences       ████░░░░░░ 40%                    │
│ Anglais        ██░░░░░░░░ 20%                    │
│ [Voir détail →]                                  │
└──────────────────────────────────────────────────┘
```

---

## Zone 9 — Gamification

### Écran 84 — Collection de badges

```
┌─ EN-TÊTE ────────────────────────────────────────┐
│ Mes badges       12 / 48                         │
│ Filtre : [Tous ▾] [Obtenus ▾] [À débloquer ▾]    │
└──────────────────────────────────────────────────┘

┌─ GRILLE ─────────────────────────────────────────┐
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 🏅 │ │ 🎯 │ │ 🔥 │ │ 📚 │ │ ⭐ │ │ 🔒 │       │
│  │Algé│ │Tir │ │Série│ │Lect│ │Star│ │ ?? │       │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘       │
│                                                  │
│  ┌────┐ ┌────┐ ┌────┐                            │
│  │ 🔒 │ │ 🔒 │ │ 🔒 │                            │
│  │ ?? │ │ ?? │ │ ?? │                            │
│  └────┘ └────┘ └────┘                            │
└──────────────────────────────────────────────────┘

(Clic sur badge obtenu → écran 85 détail)
(Clic sur badge verrouillé → condition de déblocage)
```

### Écran 88 — Animation de déblocage (overlay)

```
┌─ MODAL PLEIN ÉCRAN (overlay sombre) ─────────────┐
│                                                  │
│             [Animation particules]               │
│                                                  │
│                   🏅                             │
│                                                  │
│         NOUVEAU BADGE DÉBLOQUÉ                   │
│                                                  │
│            Algébriste débutant                   │
│                                                  │
│   "Tu as réussi ton premier quiz d'algèbre       │
│    avec plus de 80% !"                           │
│                                                  │
│   +100 XP bonus                                  │
│                                                  │
│              [Génial ! →]                        │
└──────────────────────────────────────────────────┘
```

---

## Zone 10 — Dashboard parent

### Écran 89 — Tableau de bord parent

```
┌─ HEADER APP (vue parent) ────────────────────────┐

┌─ CONTENU ────────────────────────────────────────┐
│ Bienvenue Marie 👋                               │
│                                                  │
│ ┌─ MES ENFANTS ───────────────────────────────┐  │
│ │ [+ Rattacher un enfant]                     │  │
│ │                                             │  │
│ │ ┌─ Lucas, 12 ans ──────────┐                │  │
│ │ │ [Avatar] Sec. 1           │                │  │
│ │ │ 🔥 Actif aujourd'hui      │                │  │
│ │ │ 📈 +15% cette semaine     │                │  │
│ │ │ [Voir détail →]           │                │  │
│ │ └───────────────────────────┘                │  │
│ │                                             │  │
│ │ ┌─ Emma, 9 ans ────────────┐                │  │
│ │ │ [Avatar] Primaire 4       │                │  │
│ │ │ 😴 Inactif depuis 3 jours │                │  │
│ │ │ [Voir détail →]           │                │  │
│ │ └───────────────────────────┘                │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ ACTIVITÉ RÉCENTE ──────────────────────────┐  │
│ │ Hier 18h : Lucas a terminé "Fractions"      │  │
│ │ Lun. 9h : Emma a gagné le badge "Lecteur"   │  │
│ │ [Voir tout l'historique →]                  │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ RAPPORT HEBDO ─────────────────────────────┐  │
│ │ 📊 Semaine du 11 au 17 mars                 │  │
│ │ [Voir le rapport complet →]                 │  │
│ └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Écran 91 — Rattacher un nouvel enfant (génération de code)

```
┌─ MODAL / PAGE ───────────────────────────────────┐
│ Rattacher un enfant                              │
│                                                  │
│ Étape 1/2 : Informations de votre enfant         │
│                                                  │
│ Prénom (utilisé dans l'app)                      │
│ [_______________________________]                │
│                                                  │
│ Âge approximatif                                 │
│ [__ ans]                                         │
│                                                  │
│ Niveau scolaire (si connu)                       │
│ [Primaire 4 ▾]                                   │
│                                                  │
│ [Continuer →]                                    │
└──────────────────────────────────────────────────┘

Après soumission :

┌─ CODE GÉNÉRÉ ────────────────────────────────────┐
│ Voici le code pour Emma                          │
│                                                  │
│        ┌─────────────────────┐                   │
│        │    4  8  2  9  1  5 │                   │
│        └─────────────────────┘                   │
│                                                  │
│ Transmets ce code à Emma. Elle le saisira        │
│ lors de la création de son compte.               │
│                                                  │
│ ⏱ Valide pendant 24 heures                       │
│                                                  │
│ [Copier] [Partager par courriel]                 │
│                                                  │
│ Tu recevras un courriel pour confirmer le        │
│ rattachement une fois Emma inscrite.             │
│                                                  │
│ [Terminé]                                        │
└──────────────────────────────────────────────────┘
```

### Écran 92 — Détail d'un enfant

```
┌─ EN-TÊTE ENFANT ─────────────────────────────────┐
│ [Avatar Lucas]  Lucas, 12 ans · Sec. 1           │
│                 Rattaché depuis le 02/01/2026    │
│                                                  │
│ [Supervision ⚙]  [Révoquer accès]                │
└──────────────────────────────────────────────────┘

┌─ ONGLETS ────────────────────────────────────────┐
│ [Vue d'ensemble●] [Matières] [Historique] [Rapp.]│
└──────────────────────────────────────────────────┘

┌─ KPI ENFANT ─────────────────────────────────────┐
│ ⏱ 4h 30 cette sem.  📚 8 leçons  ⭐ 420 XP      │
│ 🔥 Série : 5 jours  🏆 12 badges                 │
└──────────────────────────────────────────────────┘

┌─ GRAPHIQUE ACTIVITÉ ─────────────────────────────┐
│ Temps par jour (7 derniers jours)                │
│ [Graphique à barres]                             │
└──────────────────────────────────────────────────┘

┌─ POINTS D'ATTENTION ─────────────────────────────┐
│ ⚠ Difficultés détectées en :                     │
│   • Équations à 2 variables (2/10 au quiz)       │
│ 💡 Suggestion : revoir la leçon 5                │
└──────────────────────────────────────────────────┘
```

---

## Zone 11 — Notifications et support

### Écran 98 — Centre de notifications

```
┌─ EN-TÊTE ────────────────────────────────────────┐
│ Notifications      [Tout marquer lu]    [⚙]      │
│ [Tout ●] [Non lu] [Récompenses] [Système]        │
└──────────────────────────────────────────────────┘

┌─ LISTE ──────────────────────────────────────────┐
│ 🏅 Aujourd'hui · 14h32                           │
│    Tu as débloqué "Algébriste débutant"          │
│    [Voir →]                                      │
│ ────                                             │
│ 🎯 Hier · 09h15                                  │
│    N'oublie pas ton objectif : 3 leçons cette    │
│    semaine (2 complétées)                        │
│    [Continuer →]                                 │
│ ────                                             │
│ 📧 Lun. 14/03                                    │
│    Ton rapport hebdomadaire est disponible       │
│    [Consulter →]                                 │
└──────────────────────────────────────────────────┘
```

---

## Zone 12 — Paiement et abonnement

### Écran 104 — Saisie paiement (Stripe Checkout embed)

```
┌─ EN-TÊTE PAIEMENT ───────────────────────────────┐
│ Passer au plan Individuel                        │
│ 12,00 $ / mois (plus TPS/TVQ)                    │
└──────────────────────────────────────────────────┘

┌─ 2 COLONNES (desktop) ───────────────────────────┐
│ ┌─ PAIEMENT ──────────────┐ ┌─ RÉCAP ──────────┐ │
│ │ Carte de crédit         │ │ Plan Individuel  │ │
│ │ [__________________]    │ │ 12,00 $/mois     │ │
│ │                         │ │                  │ │
│ │ Expir. [__/__] CVC [___]│ │ TPS (5%) : 0,60$ │ │
│ │                         │ │ TVQ (9,975%):1,20│ │
│ │ Code postal             │ │                  │ │
│ │ [________]              │ │ ─────────────    │ │
│ │                         │ │ Total : 13,80 $  │ │
│ │ [Autre mode de paiement]│ │                  │ │
│ │                         │ │ ✓ Annulable à    │ │
│ │ 🔒 Paiement sécurisé    │ │   tout moment    │ │
│ │    par Stripe           │ │ ✓ TPS/TVQ incl.  │ │
│ │                         │ │                  │ │
│ │ [Payer 13,80 $]         │ │                  │ │
│ └─────────────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Écran 108 — Mon abonnement

```
┌─ CARTE PRINCIPALE ───────────────────────────────┐
│ Plan actuel : Individuel                         │
│ 12,00 $/mois · Prochaine facture le 18 avr. 2026 │
│ ✓ Actif                                          │
│                                                  │
│ [Changer de plan]  [Annuler l'abonnement]        │
└──────────────────────────────────────────────────┘

┌─ MOYEN DE PAIEMENT ──────────────────────────────┐
│ 💳 Visa **** 4242  exp. 08/27                    │
│ [Modifier]                                       │
└──────────────────────────────────────────────────┘

┌─ HISTORIQUE ─────────────────────────────────────┐
│ 18 mars 2026 · 13,80 $ · Payé   [📄 Reçu]        │
│ 18 fév. 2026 · 13,80 $ · Payé   [📄 Reçu]        │
│ [Voir tout]                                      │
└──────────────────────────────────────────────────┘
```

---

## Zone 13 — Écrans système

### Écran 112 — Splash mobile

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│              [Logo EduQuiz]              │
│                                          │
│                 ●●●                      │
│              (loader)                    │
│                                          │
│          v1.0.0 · 2026                   │
└──────────────────────────────────────────┘
```

### Écran 113 — Premier lancement (permissions)

```
┌──────────────────────────────────────────┐
│ Bienvenue sur EduQuiz !                  │
│                                          │
│ Nous avons besoin de quelques accès      │
│ pour te donner la meilleure expérience.  │
│                                          │
│ 🔔 Notifications                         │
│    Recevoir rappels et récompenses       │
│    [Autoriser]                           │
│                                          │
│ 📁 Stockage                              │
│    Sauvegarder les leçons hors ligne     │
│    [Autoriser]                           │
│                                          │
│ Tu peux modifier ces choix dans les      │
│ paramètres à tout moment.                │
│                                          │
│ [Plus tard]        [Continuer →]         │
└──────────────────────────────────────────┘
```

---

## Zone 14 — Modales transverses

### Écran 118 — Confirmation d'action destructive

```
┌─ MODAL (overlay) ────────────────────────────────┐
│ ⚠  Confirmer la suppression                      │
│                                                  │
│ [Message contextuel, ex :]                       │
│ Es-tu sûr de vouloir supprimer ton compte ?      │
│ Cette action est irréversible après 30 jours.    │
│                                                  │
│ [Annuler]                 [Oui, supprimer]       │
└──────────────────────────────────────────────────┘
```

### Écran 122 — Overlay tutoriel contextuel

```
┌─ OVERLAY SEMI-TRANSPARENT ───────────────────────┐
│                                                  │
│  [Zone spotlight sur un élément UI]              │
│                                                  │
│     ┌────────────────────────────────────┐       │
│     │ 💡 Astuce                          │       │
│     │ Clique ici pour lancer un quiz     │       │
│     │ et tester tes connaissances.       │       │
│     │                                    │       │
│     │ [Compris]  [Me montrer plus]       │       │
│     └────────────────────────────────────┘       │
│                                                  │
│                              ●●○○○  [Passer]     │
└──────────────────────────────────────────────────┘
```

---

## Principes transversaux de conception

**Responsive** : tous les écrans ont une version mobile (320-480px), tablette (768px), desktop (1024px+). La sidebar devient un drawer sur mobile. Les grilles 4 colonnes passent à 2 puis 1.

**États obligatoires pour chaque écran** : vide (empty state avec CTA), chargement (skeleton screens, jamais de spinner seul), erreur (avec action de récupération), succès.

**Hiérarchie typographique** : titre principal (H1, 32px), titres de section (H2, 24px), sous-titres (H3, 18px), corps (16px), secondaire (14px), métadonnées (12px). Respect strict.

**Système de couleurs** : primaire (action CTA), secondaire (actions alternatives), succès (vert), erreur (rouge), avertissement (jaune), info (bleu). Mode sombre obligatoire.

**Accessibilité sur chaque écran** : contraste AA minimum, focus visible au clavier, labels ARIA, navigation logique.

**Bilinguisme** : tout texte doit avoir son pendant FR/EN, avec gestion des longueurs différentes (l'anglais est généralement 20% plus court que le français).

**Feedback utilisateur** : toute action déclenche un feedback (toast, changement d'état, transition). Jamais de clic sans retour.