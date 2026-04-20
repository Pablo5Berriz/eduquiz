-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Tentatives, progression, badges, streaks
--
--  Règles :
--    • Un apprenant voit ses propres tentatives, progression et badges.
--    • Un parent vérifié (lien `VERIFIED`) voit ceux de ses enfants.
--    • Les admins voient tout (support, qualité pédagogique).
--    • `attempts` / `attempt_answers` sont append-only (triggers) : seuls
--      les INSERT sont autorisés, par l'apprenant lui-même.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── attempts ────────────────────────────────────────────────────────────────
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempts" FORCE ROW LEVEL SECURITY;

CREATE POLICY attempts_self_parent_admin_select ON "attempts"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR app_is_verified_parent_of(user_id)
);

CREATE POLICY attempts_self_insert ON "attempts"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

-- ─── attempt_answers ─────────────────────────────────────────────────────────
ALTER TABLE "attempt_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempt_answers" FORCE ROW LEVEL SECURITY;

CREATE POLICY attempt_answers_self_parent_admin_select ON "attempt_answers"
FOR SELECT USING (
  app_is_admin()
  OR EXISTS (
    SELECT 1 FROM attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND (
        a.user_id = app_current_user_id()
        OR app_is_verified_parent_of(a.user_id)
      )
  )
);

CREATE POLICY attempt_answers_self_insert ON "attempt_answers"
FOR INSERT WITH CHECK (
  app_is_admin()
  OR EXISTS (
    SELECT 1 FROM attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = app_current_user_id()
  )
);

-- ─── progress ────────────────────────────────────────────────────────────────
ALTER TABLE "progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progress" FORCE ROW LEVEL SECURITY;

CREATE POLICY progress_self_parent_admin_select ON "progress"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR app_is_verified_parent_of(user_id)
);

CREATE POLICY progress_self_upsert ON "progress"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY progress_self_update ON "progress"
FOR UPDATE USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY progress_admin_delete ON "progress"
FOR DELETE USING (app_is_admin());

-- ─── user_badges ─────────────────────────────────────────────────────────────
ALTER TABLE "user_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_badges" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_badges_self_parent_admin_select ON "user_badges"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR app_is_verified_parent_of(user_id)
);

CREATE POLICY user_badges_admin_write ON "user_badges"
FOR INSERT WITH CHECK (app_is_admin());

CREATE POLICY user_badges_admin_delete ON "user_badges"
FOR DELETE USING (app_is_admin());

-- ─── streaks ─────────────────────────────────────────────────────────────────
ALTER TABLE "streaks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "streaks" FORCE ROW LEVEL SECURITY;

CREATE POLICY streaks_self_parent_admin_select ON "streaks"
FOR SELECT USING (
  app_is_admin()
  OR user_id = app_current_user_id()
  OR app_is_verified_parent_of(user_id)
);

CREATE POLICY streaks_self_upsert ON "streaks"
FOR INSERT WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY streaks_self_update ON "streaks"
FOR UPDATE USING (
  app_is_admin() OR user_id = app_current_user_id()
) WITH CHECK (
  app_is_admin() OR user_id = app_current_user_id()
);

CREATE POLICY streaks_admin_delete ON "streaks"
FOR DELETE USING (app_is_admin());
