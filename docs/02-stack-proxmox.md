# Stack technique et hébergement Proxmox

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