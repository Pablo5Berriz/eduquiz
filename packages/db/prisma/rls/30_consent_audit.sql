-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Consentement, audit, incidents, demandes Loi 25
--
--  Règles Loi 25 :
--    • `consent_records` et `audit_logs` sont append-only (triggers
--      append_only) : ici on ne gère que la visibilité SELECT et l'INSERT.
--    • Les UPDATE/DELETE sont de toute façon rejetés au niveau trigger
--      — on les bloque aussi via RLS pour les non-admins.
--    • `incident_registers` n'est visible qu'aux admins (PII indirecte).
--    • `data_requests` : visible par le demandeur et les admins.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── consent_records ─────────────────────────────────────────────────────────
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_records" FORCE ROW LEVEL SECURITY;

CREATE POLICY consent_records_self_or_admin_select ON "consent_records"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR subject_user_id = app_current_user_id()
  OR (subject_user_id IS NOT NULL AND app_is_verified_parent_of(subject_user_id))
);

CREATE POLICY consent_records_self_insert ON "consent_records"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

-- ─── audit_logs ──────────────────────────────────────────────────────────────
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_self_or_admin_select ON "audit_logs"
FOR SELECT USING (
  app_is_admin()
  OR actor_id = app_current_user_id()
  OR target_id = app_current_user_id()
);

-- Tout le monde authentifié peut écrire un événement le concernant ;
-- l'appli centralise les writes via un helper qui renseigne `actor_id`.
CREATE POLICY audit_logs_authenticated_insert ON "audit_logs"
FOR INSERT WITH CHECK (
  app_current_user_id() IS NOT NULL
);

-- ─── incident_registers ──────────────────────────────────────────────────────
ALTER TABLE "incident_registers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incident_registers" FORCE ROW LEVEL SECURITY;

CREATE POLICY incident_registers_admin_only ON "incident_registers"
FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ─── data_requests ───────────────────────────────────────────────────────────
ALTER TABLE "data_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY data_requests_self_or_admin_select ON "data_requests"
FOR SELECT USING (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY data_requests_self_insert ON "data_requests"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY data_requests_self_cancel ON "data_requests"
FOR UPDATE USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY data_requests_admin_delete ON "data_requests"
FOR DELETE USING (app_is_admin());
