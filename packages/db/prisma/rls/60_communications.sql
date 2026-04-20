-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Notifications in-app
--
--  L'utilisateur ne voit que ses propres notifications. Les admins
--  voient tout (support). L'écriture est réservée aux admins et au
--  service-role interne (via client sans RLS).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;

CREATE POLICY notifications_self_or_admin_select ON "notifications"
FOR SELECT USING (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY notifications_self_update ON "notifications"
FOR UPDATE USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY notifications_admin_insert ON "notifications"
FOR INSERT WITH CHECK (app_is_admin());

CREATE POLICY notifications_self_or_admin_delete ON "notifications"
FOR DELETE USING (
  app_is_admin() OR user_id = app_current_user_id()
);
