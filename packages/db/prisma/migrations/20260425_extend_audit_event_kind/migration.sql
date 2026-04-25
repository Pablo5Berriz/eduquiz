-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : étend l'enum `audit_event_kind` pour le flux d'inscription
-- (étape 1.4). Ajoute deux valeurs :
--   • AUTH_USER_CREATED : tracé à la création d'un compte (server action
--     d'inscription adulte). Permet l'audit Loi 25 et le décompte des
--     inscriptions par jour.
--   • AUTH_VERIFY_EMAIL : tracé à la confirmation d'un email via le lien
--     reçu (consommation du token "verify-email").
--
-- Les `ALTER TYPE … ADD VALUE` Postgres sont idempotents avec `IF NOT EXISTS`
-- depuis PG 9.6 — on peut donc rejouer la migration sans erreur.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE "audit_event_kind" ADD VALUE IF NOT EXISTS 'AUTH_USER_CREATED';
ALTER TYPE "audit_event_kind" ADD VALUE IF NOT EXISTS 'AUTH_VERIFY_EMAIL';
