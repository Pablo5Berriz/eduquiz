-- ─────────────────────────────────────────────────────────────────────────────
--  Initialisation PostgreSQL pour l'environnement dev EduQuiz.
--
--  Ce script est monté en read-only dans /docker-entrypoint-initdb.d/ et
--  exécuté UNE SEULE FOIS, à la toute première création du volume, par
--  l'image officielle `postgres`. Il doit donc être idempotent (IF NOT
--  EXISTS) et ne doit pas supposer d'état préalable.
--
--  Les extensions installées ici sont celles déclarées dans
--  packages/db/prisma/schema.prisma via `postgresqlExtensions` (pgcrypto,
--  citext). Prisma ne les crée PAS automatiquement au moment du
--  `prisma migrate dev` ; elles doivent donc être présentes au niveau
--  base de données avant l'application de la migration `20260419220000_init`.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
