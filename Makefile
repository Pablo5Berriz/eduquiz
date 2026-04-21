# ─────────────────────────────────────────────────────────────────────────────
#  Makefile EduQuiz
#
#  Raccourcis ergonomiques pour les tâches de dev récurrentes. La
#  totalité du monorepo reste pilotable sans make (via pnpm + docker
#  compose directs), ce fichier n'est qu'un sucre syntaxique.
#
#  Commandes les plus utiles :
#    make dev        — démarrer la pile Docker + les watchers pnpm
#    make dev-up     — démarrer uniquement la pile Docker (arrière-plan)
#    make dev-down   — stopper la pile Docker (garde les volumes)
#    make db:migrate — appliquer les migrations Prisma
#    make db:seed    — insérer les données de référence
#    make db:reset   — ⚠ drop + re-migrate + re-seed (perte de données)
#    make lint       — lint turborepo full
#    make typecheck  — typecheck turborepo full
#    make test       — tests turborepo full
# ─────────────────────────────────────────────────────────────────────────────

SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE_DEV := docker compose -f infra/docker/docker-compose.dev.yml

# Cible réelle (pas `.PHONY`) : toutes les cibles sont déclarées ici pour
# éviter les collisions avec des fichiers/dossiers de même nom.
.PHONY: help \
        dev dev-up dev-down dev-reset dev-logs \
        install \
        db:generate db:migrate db:seed db:reset db:studio \
        lint lint-fix typecheck test build clean format

help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_:-]+:.*?## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Développement ───────────────────────────────────────────────────────────

dev: dev-up ## Stack Docker + pnpm dev (mode foreground)
	pnpm dev

dev-up: ## Lance PostgreSQL, Redis, MailHog, MinIO en arrière-plan
	$(COMPOSE_DEV) up -d

dev-down: ## Stoppe les services dev (garde les volumes)
	$(COMPOSE_DEV) down

dev-reset: ## ⚠ Stoppe + détruit les volumes (perte base locale + objets S3)
	$(COMPOSE_DEV) down -v

dev-logs: ## Tail des logs Docker
	$(COMPOSE_DEV) logs -f

# ── Dépendances ─────────────────────────────────────────────────────────────

install: ## pnpm install à la racine
	pnpm install

# ── Base de données ─────────────────────────────────────────────────────────

db\:generate: ## Génère le client Prisma (packages/db/src/generated/client)
	pnpm --filter @eduquiz/db run db:generate

db\:migrate: ## Applique les migrations Prisma en dev
	pnpm --filter @eduquiz/db run db:migrate

db\:seed: ## Insère les données de référence (idempotent)
	pnpm --filter @eduquiz/db run db:seed

db\:reset: ## ⚠ Drop + migrate + seed (équivalent prisma migrate reset)
	pnpm --filter @eduquiz/db run db:reset

db\:studio: ## Ouvre Prisma Studio sur la base dev
	pnpm --filter @eduquiz/db exec prisma studio --schema prisma/schema.prisma

# ── Qualité ─────────────────────────────────────────────────────────────────

lint: ## ESLint sur tout le monorepo (turbo)
	pnpm lint

lint-fix: ## ESLint --fix sur tout le monorepo
	pnpm lint:fix

typecheck: ## tsc --noEmit sur tout le monorepo (turbo)
	pnpm typecheck

test: ## Vitest sur tout le monorepo (turbo)
	pnpm test

format: ## Prettier --write sur tout le monorepo
	pnpm format

# ── Build et nettoyage ──────────────────────────────────────────────────────

build: ## turbo run build
	pnpm build

clean: ## Supprime dist/, .turbo/, node_modules/ partout
	pnpm clean
