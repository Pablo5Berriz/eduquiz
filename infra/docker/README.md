# Infrastructure Docker — EduQuiz

Pile de services Docker Compose pour les environnements `dev` et (à venir)
`prod`. Le dossier `infra/` regroupe tout ce qui n'est pas du code applicatif :
compose files, scripts d'init SQL, Dockerfiles dédiés, etc.

## Fichiers

- `docker-compose.dev.yml` — stack complète pour développement local (PostgreSQL
  16, Redis 7, MailHog, MinIO)
- `init/01-extensions.sql` — script exécuté au premier démarrage de PostgreSQL
  qui installe `pgcrypto` et `citext` (extensions requises par
  `packages/db/prisma/schema.prisma`)

## Usage quotidien

Toutes les commandes peuvent être lancées soit via `make` (voir `Makefile` à la
racine du repo), soit directement avec `docker compose`.

```bash
# Démarrer la pile en arrière-plan
make dev-up            # == docker compose -f infra/docker/docker-compose.dev.yml up -d

# Voir les logs
make dev-logs          # == docker compose ... logs -f

# Arrêter (sans détruire les volumes)
make dev-down          # == docker compose ... down

# Réinitialiser complètement (⚠ efface les volumes et les données)
make dev-reset         # == docker compose ... down -v
```

## Services et accès

| Service    | Host             | Port   | Credentials                     |
| ---------- | ---------------- | ------ | ------------------------------- |
| PostgreSQL | `localhost`      | `5432` | `eduquiz` / `eduquiz`           |
| Redis      | `localhost`      | `6379` | —                               |
| MailHog    | `localhost:8025` | —      | UI web pour lire les mails      |
| MinIO API  | `localhost:9000` | `9000` | `eduquiz` / `eduquiz-minio-dev` |
| MinIO UI   | `localhost:9001` | —      | `eduquiz` / `eduquiz-minio-dev` |

Ces credentials sont **strictement locaux** et ne correspondent à aucun
environnement déployé. La prod sera configurée à l'étape 0.5 avec des secrets
générés par l'opérateur lors du déploiement Proxmox.

## Initialisation PostgreSQL

Le script `init/01-extensions.sql` est monté en lecture seule dans
`/docker-entrypoint-initdb.d/`. Il est exécuté **une seule fois**, au moment de
la toute première création du volume `eduquiz-postgres-dev`, par l'image
officielle `postgres`. Pour le re-exécuter (rare), il faut détruire puis recréer
le volume :

```bash
make dev-reset         # détruit les volumes
make dev-up            # recrée la base → init script rejoué
```

Les migrations Prisma (`packages/db/prisma/migrations/`) sont appliquées ensuite
via `pnpm --filter @eduquiz/db run db:migrate` (ou `make db:migrate`).

## Variables d'environnement

Les variables utilisées par les services sont lues depuis `.env` à la racine du
repo (voir `.env.example`). Par défaut, si `.env` n'existe pas, Compose utilise
les valeurs de repli déclarées dans le fichier (`${POSTGRES_USER:-eduquiz}`
etc.), donc la stack démarre sans configuration préalable.

## Prod

Le fichier `docker-compose.prod.yml` sera ajouté à l'étape 0.5 (cible Proxmox)
avec : volumes chiffrés, réseau isolé, TLS, backup automatique des volumes
PostgreSQL et MinIO. Voir `docs/infrastructure/` (à venir).
