-- ─────────────────────────────────────────────────────────────────────────────
--  Rôles applicatifs non-superuser pour EduQuiz.
--
--  Ce script est exécuté une seule fois au premier démarrage du volume
--  PostgreSQL (monté via docker-entrypoint-initdb.d), AVANT les migrations
--  Prisma. Il crée deux rôles applicatifs et configure ALTER DEFAULT
--  PRIVILEGES pour que tous les objets créés par le superuser `eduquiz`
--  (lors des migrations) soient automatiquement accessibles aux deux rôles.
--
--  ┌──────────────────┬───────────────────────────────────────────────────────┐
--  │ Rôle             │ Usage                                                │
--  ├──────────────────┼───────────────────────────────────────────────────────┤
--  │ eduquiz          │ SUPERUSER — migrations Prisma et admin DB uniquement │
--  │ eduquiz_app      │ NOSUPERUSER NOBYPASSRLS — client `prisma` + withUser │
--  │ eduquiz_service  │ NOSUPERUSER BYPASSRLS — client `prismaService`       │
--  └──────────────────┴───────────────────────────────────────────────────────┘
--
--  Pourquoi deux rôles applicatifs ?
--
--    • `eduquiz_app` (DATABASE_URL) est soumis aux policies RLS. C'est le
--      rôle par défaut utilisé par le client Prisma scoped via `withUser()`.
--      Toute route authentifiée qui passe par `withUser({ userId, role })`
--      injecte les variables de session `app.current_user_id` /
--      `app.current_role` lues par les policies.
--
--    • `eduquiz_service` (SERVICE_DATABASE_URL) contourne les policies RLS
--      (BYPASSRLS) MAIS n'est PAS superuser : pas de CREATEDB, CREATEROLE,
--      ni accès DDL. Il est réservé aux chemins de code qui opèrent
--      légitimement cross-user ou sans contexte utilisateur :
--        - register.ts         (l'utilisateur n'existe pas encore)
--        - verify-email.ts     (consommation de token sans session)
--        - forgot-password.ts  (lookup par email sans session)
--        - auth/server.ts      (résolution de session Auth.js)
--        - admin/actions.ts    (mutations admin cross-user)
--        - family/actions.ts   (rattachement parent ↔ enfant cross-user)
--        - purgeExpiredAccounts.ts (cron système sans utilisateur)
--
--  Les mots de passe ci-dessous sont des placeholders pour le développement
--  local uniquement. En production, utiliser des secrets forts injectés via
--  les variables d'environnement DATABASE_URL et SERVICE_DATABASE_URL.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── eduquiz_app : rôle soumis aux policies RLS ─────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eduquiz_app') THEN
    CREATE ROLE eduquiz_app
      WITH LOGIN
      PASSWORD 'eduquiz_app_dev'
      NOSUPERUSER
      NOBYPASSRLS
      NOCREATEDB
      NOCREATEROLE;
  END IF;
END
$$;

-- ─── eduquiz_service : rôle bypass RLS, non-superuser ───────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eduquiz_service') THEN
    CREATE ROLE eduquiz_service
      WITH LOGIN
      PASSWORD 'eduquiz_service_dev'
      NOSUPERUSER
      BYPASSRLS
      NOCREATEDB
      NOCREATEROLE;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
--  Privilèges par défaut pour les objets futurs
--
--  Les migrations Prisma tournent sous le rôle `eduquiz` (superuser).
--  ALTER DEFAULT PRIVILEGES fait en sorte que chaque table, séquence et
--  fonction créée par `eduquiz` dans le schéma public soit automatiquement
--  accessible aux deux rôles applicatifs — pas besoin de repasser des GRANT
--  manuels après chaque migration.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO eduquiz_app, eduquiz_service;

ALTER DEFAULT PRIVILEGES FOR ROLE eduquiz IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO eduquiz_app, eduquiz_service;

ALTER DEFAULT PRIVILEGES FOR ROLE eduquiz IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO eduquiz_app, eduquiz_service;

ALTER DEFAULT PRIVILEGES FOR ROLE eduquiz IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO eduquiz_app, eduquiz_service;

-- ─────────────────────────────────────────────────────────────────────────────
--  Privilèges explicites sur les objets existants (idempotent)
--
--  Si ce script tourne sur une base où les migrations ont déjà été
--  appliquées (reconstruction du volume, ajout tardif des rôles), les
--  GRANTs ci-dessous couvrent les tables déjà créées. Sur une base vierge
--  (premier démarrage), ils sont ignorés car les tables n'existent pas
--  encore — ALTER DEFAULT PRIVILEGES prend le relais.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eduquiz_app, eduquiz_service;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO eduquiz_app, eduquiz_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO eduquiz_app, eduquiz_service;
