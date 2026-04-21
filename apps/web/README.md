# @eduquiz/web

Application web d'EduQuiz basée sur Next.js 14 (App Router + React Server
Components + Server Actions).

## Responsabilités

- Vitrine publique marketing (Lot 1 — 14 écrans).
- Application apprenant adulte et mineur (Lots 2 à 9).
- Dashboard parent et supervision (Lots 10-11).
- Paiement et gestion d'abonnement (Lot 12).
- Back-office admin contenu sous `/admin` avec protection par rôle (Lot 13).

## Scripts

```bash
pnpm --filter @eduquiz/web dev        # next dev, port 3000
pnpm --filter @eduquiz/web build      # build standalone (Docker prod étape 0.5)
pnpm --filter @eduquiz/web start      # next start (post-build)
pnpm --filter @eduquiz/web lint       # next lint, max-warnings=0
pnpm --filter @eduquiz/web typecheck  # tsc --noEmit
```

Pendant le développement, la pile Docker Compose doit être active pour que la
route `GET /api/health` puisse interroger PostgreSQL :

```bash
make dev-up
pnpm --filter @eduquiz/web dev
```

## Structure

```
apps/web/
  src/app/
    layout.tsx               # Layout racine (metadata, globals.css, FR par défaut)
    page.tsx                 # Page d'accueil publique
    globals.css              # Directives Tailwind + tokens CSS
    api/health/route.ts      # Endpoint de santé (probes Docker/CI)
  next.config.mjs             # transpilePackages, output standalone
  tailwind.config.js          # Étend @eduquiz/config/tailwind
  postcss.config.js           # Tailwind + autoprefixer
  tsconfig.json               # Hérite de @eduquiz/config/tsconfig-nextjs
  eslint.config.js            # base + react + nextjs + prettier
```

## i18n

Actuellement, la locale est figée à `fr` via `@eduquiz/i18n`. Le middleware de
détection + le cookie `NEXT_LOCALE` seront ajoutés à l'étape 1.x avec le
parcours apprenant.

## Déploiement

`output: 'standalone'` est activé : `next build` produit un dossier
`.next/standalone/` autonome qui sera empaqueté dans une image Docker minimale à
l'étape 0.5. Les assets statiques devront être copiés séparément
(`.next/static/` → `.next/standalone/.next/static/`).
