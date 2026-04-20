-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Abonnement et paiements
--
--  Un utilisateur ne voit que son propre abonnement et son propre
--  historique de paiements. Les admins ont accès complet (support,
--  réconciliation Stripe). Les webhooks Stripe passent par une route
--  API dédiée côté app qui utilise un client service-role sans RLS
--  (voir `packages/db/src/client.ts`).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_self_or_admin ON "subscriptions"
FOR ALL USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;

CREATE POLICY payments_self_or_admin_select ON "payments"
FOR SELECT USING (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY payments_admin_write ON "payments"
FOR INSERT WITH CHECK (app_is_admin());

CREATE POLICY payments_admin_update ON "payments"
FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY payments_admin_delete ON "payments"
FOR DELETE USING (app_is_admin());
