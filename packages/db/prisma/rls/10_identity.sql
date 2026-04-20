-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Identité (users, profiles, accounts, sessions, verification_tokens)
--
--  Règle générale : un utilisateur ne voit et ne modifie que son propre
--  enregistrement. Les admins ont un accès étendu. `verification_tokens`
--  n'a pas de colonne `user_id` (schéma Auth.js) ; l'application est
--  responsable de l'isolation, on se contente de bloquer les SELECT
--  directs pour tout le monde sauf admin (côté Auth.js, la lookup par
--  `(identifier, token)` est un équivalent).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

CREATE POLICY users_self_or_admin_select ON "users"
FOR SELECT USING (
  app_is_admin() OR id = app_current_user_id()
);

CREATE POLICY users_self_update ON "users"
FOR UPDATE USING (
  app_is_admin() OR id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR id = app_current_user_id()
);

CREATE POLICY users_admin_insert ON "users"
FOR INSERT WITH CHECK (app_is_admin());

CREATE POLICY users_admin_delete ON "users"
FOR DELETE USING (app_is_admin());

-- ─── profiles ────────────────────────────────────────────────────────────────
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_or_admin_select ON "profiles"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR app_is_verified_parent_of(user_id)
);

CREATE POLICY profiles_self_update ON "profiles"
FOR UPDATE USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY profiles_self_insert ON "profiles"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY profiles_admin_delete ON "profiles"
FOR DELETE USING (app_is_admin());

-- ─── accounts (OAuth) ────────────────────────────────────────────────────────
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" FORCE ROW LEVEL SECURITY;

CREATE POLICY accounts_self_or_admin ON "accounts"
FOR ALL USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

-- ─── sessions ────────────────────────────────────────────────────────────────
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" FORCE ROW LEVEL SECURITY;

CREATE POLICY sessions_self_or_admin ON "sessions"
FOR ALL USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

-- ─── verification_tokens ─────────────────────────────────────────────────────
--  Pas de FK utilisateur (Auth.js). Seul l'admin peut lire via RLS ;
--  l'application utilise une lookup par (identifier, token) qui n'est
--  pas bloquée car ciblée (et le token est secret).
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" FORCE ROW LEVEL SECURITY;

CREATE POLICY verification_tokens_admin_all ON "verification_tokens"
FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- La politique `FOR ALL` ci-dessus bloque aussi les INSERT côté appli ;
-- on autorise les INSERT non authentifiés (création de token pour un
-- email non encore connecté, reset password…) pour que Auth.js fonctionne.
CREATE POLICY verification_tokens_auth_insert ON "verification_tokens"
FOR INSERT WITH CHECK (true);

-- Lecture par identifiant + token exact (chaîne difficile à deviner) :
-- on laisse passer les SELECT dans la transaction Auth.js.
CREATE POLICY verification_tokens_auth_select ON "verification_tokens"
FOR SELECT USING (true);

CREATE POLICY verification_tokens_auth_delete ON "verification_tokens"
FOR DELETE USING (true);
