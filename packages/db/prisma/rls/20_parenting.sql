-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Liens parentaux (parent_child_links)
--
--  Chaque ligne est visible par : le parent, l'enfant lié, ou l'admin.
--  Création : par le parent uniquement (génère le code) ou un admin.
--  Mise à jour : par le parent (révocation) ou l'enfant (passage à
--  PENDING via saisie du code) — la règle métier précise qui peut
--  changer quel champ, mais RLS ne distingue pas finement les colonnes.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "parent_child_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parent_child_links" FORCE ROW LEVEL SECURITY;

CREATE POLICY parent_child_links_visible ON "parent_child_links"
FOR SELECT USING (
  app_is_admin()
  OR parent_id = app_current_user_id()
  OR child_id = app_current_user_id()
);

CREATE POLICY parent_child_links_parent_or_admin_insert ON "parent_child_links"
FOR INSERT WITH CHECK (
  app_is_admin() OR parent_id = app_current_user_id()
);

CREATE POLICY parent_child_links_parent_child_or_admin_update ON "parent_child_links"
FOR UPDATE USING (
  app_is_admin()
  OR parent_id = app_current_user_id()
  OR child_id = app_current_user_id()
) WITH CHECK (
  app_is_admin()
  OR parent_id = app_current_user_id()
  OR child_id = app_current_user_id()
);

CREATE POLICY parent_child_links_admin_delete ON "parent_child_links"
FOR DELETE USING (app_is_admin());
