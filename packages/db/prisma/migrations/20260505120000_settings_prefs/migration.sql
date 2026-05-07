-- Migration : préférences UI + notifications e-mail + email en attente
-- Ajoute 8 colonnes à `profiles` et 1 colonne à `users`.

-- ── users ────────────────────────────────────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "pending_email" CITEXT;

-- ── profiles — préférences UI ────────────────────────────────────────────────
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "theme"          VARCHAR(16)  NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "reduced_motion" BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "high_contrast"  BOOLEAN      NOT NULL DEFAULT FALSE;

-- ── profiles — préférences e-mail ────────────────────────────────────────────
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "notif_weekly_report"       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "notif_progress_milestone"  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "notif_content_new"         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "notif_streak_reminder"     BOOLEAN NOT NULL DEFAULT TRUE;
