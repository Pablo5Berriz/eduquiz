# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
#  Image de production pour `apps/web` (Next.js 14, output standalone).
#
#  Construire depuis la racine du repo (contexte = monorepo complet car Turbo
#  et pnpm ont besoin des packages partagés) :
#
#      docker build \
#          -f infra/docker/web.Dockerfile \
#          -t eduquiz/web:local \
#          .
#
#  Trois stages :
#    1. deps     — installe les dépendances pnpm (cache monté).
#    2. builder  — exécute `prisma generate`, `next build`, produit
#                  `.next/standalone` + `.next/static` + `public`.
#    3. runner   — image finale minimale (node:22-alpine), utilisateur non-root,
#                  ne contient QUE l'artefact standalone + assets.
#
#  Taille cible : < 200 Mo.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1 : dépendances ───────────────────────────────────────────────────
FROM node:22-alpine AS deps

# libc6-compat : requis par Next.js (bindings binaires) sur alpine.
RUN apk add --no-cache libc6-compat

# Corepack active pnpm à la version pinnée dans package.json (packageManager).
RUN corepack enable

WORKDIR /repo

# Copier d'abord UNIQUEMENT les manifests pour maximiser le cache Docker :
# tant que les deps ne changent pas, ce layer reste en cache même si le code
# change.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/i18n/package.json packages/i18n/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/

# --frozen-lockfile : échec si pnpm-lock.yaml désynchronisé (garantie repro).
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ── Stage 2 : build ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

WORKDIR /repo

# Récupérer les node_modules hydratés du stage `deps`.
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages ./packages

# Copier le reste du monorepo (code source + configs partagées).
COPY . .

# Prisma generate DOIT précéder `next build` pour que le client soit disponible
# au typage et au runtime. `postinstall` du package @eduquiz/db le fait déjà,
# mais on le rappelle explicitement pour être défensif vis-à-vis des caches.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @eduquiz/db run db:generate

# Variables d'environnement "build-time" pour Next.js : injectées uniquement
# si passées en `--build-arg`. Les vraies valeurs runtime sont lues au
# démarrage du container (variables `process.env` côté serveur).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_SUPPORTED_LOCALES
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_DEFAULT_LOCALE=${NEXT_PUBLIC_DEFAULT_LOCALE}
ENV NEXT_PUBLIC_SUPPORTED_LOCALES=${NEXT_PUBLIC_SUPPORTED_LOCALES}

RUN pnpm --filter @eduquiz/web run build


# ── Stage 3 : runtime ───────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Outils runtime minimaux :
#   - libc6-compat : idem stage build.
#   - tini         : PID 1 correct (reap de zombies, signaux propagés).
#   - curl         : healthcheck HTTP.
RUN apk add --no-cache libc6-compat tini curl

# Utilisateur non-root (UID/GID fixes pour que les volumes montés soient
# réappropriables côté hôte sans mystère).
RUN addgroup -g 1001 -S eduquiz && adduser -u 1001 -S eduquiz -G eduquiz

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copier l'artefact standalone (contient node_modules minimaux + server.js).
COPY --from=builder --chown=eduquiz:eduquiz /repo/apps/web/.next/standalone ./
# Les assets statiques ne sont PAS inclus dans standalone, il faut les copier
# séparément au bon endroit (cf. docs Next.js "Deploying with Docker").
COPY --from=builder --chown=eduquiz:eduquiz /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=eduquiz:eduquiz /repo/apps/web/public ./apps/web/public

# Prisma engines : Prisma a besoin des binaires Query Engine au runtime. Ils
# sont normalement inclus dans `node_modules/.prisma/client`, que Next ajoute
# à standalone via `outputFileTracingRoot`. On les copie défensivement.
COPY --from=builder --chown=eduquiz:eduquiz /repo/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma

USER eduquiz

EXPOSE 3000

# Healthcheck interne : Next doit répondre sur /api/health avec 200.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

# tini gère PID 1, `node server.js` est l'entrypoint standard de l'output
# standalone de Next.js 14.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
