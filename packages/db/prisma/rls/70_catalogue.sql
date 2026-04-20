-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Catalogue pédagogique (Level, Subject, Skill, Course, Lesson,
--  Activity, Exercise, Quiz, Question, Answer, Badge, ContentVersion,
--  LessonSkillLink)
--
--  Le catalogue est largement public : tout utilisateur authentifié
--  voit les contenus `PUBLISHED`. Seul un admin voit aussi les
--  `DRAFT`, `IN_REVIEW` et `ARCHIVED`. L'écriture est réservée aux
--  admins (les auteurs/éditeurs partagent le rôle ADMIN en V1 ; un rôle
--  dédié `EDITOR` sera ajouté en V2 si besoin).
--
--  Exception `badges` et `content_versions` : visibles uniquement aux
--  admins pour ne pas divulguer les critères exacts d'obtention.
-- ─────────────────────────────────────────────────────────────────────────────

-- Tables purement "catalogue" sans notion de statut : lecture libre,
-- écriture admin uniquement.
ALTER TABLE "levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "levels" FORCE ROW LEVEL SECURITY;
CREATE POLICY levels_public_select ON "levels" FOR SELECT USING (true);
CREATE POLICY levels_admin_write ON "levels" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY levels_admin_update ON "levels" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY levels_admin_delete ON "levels" FOR DELETE USING (app_is_admin());

ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" FORCE ROW LEVEL SECURITY;
CREATE POLICY subjects_select ON "subjects"
FOR SELECT USING (app_is_admin() OR is_published = true);
CREATE POLICY subjects_admin_write ON "subjects" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY subjects_admin_update ON "subjects" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY subjects_admin_delete ON "subjects" FOR DELETE USING (app_is_admin());

ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skills" FORCE ROW LEVEL SECURITY;
CREATE POLICY skills_public_select ON "skills" FOR SELECT USING (true);
CREATE POLICY skills_admin_write ON "skills" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY skills_admin_update ON "skills" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY skills_admin_delete ON "skills" FOR DELETE USING (app_is_admin());

-- Tables avec statut éditorial : les non-admins ne voient que PUBLISHED.
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" FORCE ROW LEVEL SECURITY;
CREATE POLICY courses_select ON "courses"
FOR SELECT USING (app_is_admin() OR status = 'PUBLISHED');
CREATE POLICY courses_admin_write ON "courses" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY courses_admin_update ON "courses" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY courses_admin_delete ON "courses" FOR DELETE USING (app_is_admin());

ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons" FORCE ROW LEVEL SECURITY;
CREATE POLICY lessons_select ON "lessons"
FOR SELECT USING (app_is_admin() OR status = 'PUBLISHED');
CREATE POLICY lessons_admin_write ON "lessons" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY lessons_admin_update ON "lessons" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY lessons_admin_delete ON "lessons" FOR DELETE USING (app_is_admin());

ALTER TABLE "lesson_skill_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_skill_links" FORCE ROW LEVEL SECURITY;
CREATE POLICY lesson_skill_links_public_select ON "lesson_skill_links"
FOR SELECT USING (true);
CREATE POLICY lesson_skill_links_admin_write ON "lesson_skill_links"
FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" FORCE ROW LEVEL SECURITY;
CREATE POLICY activities_select ON "activities"
FOR SELECT USING (app_is_admin() OR status = 'PUBLISHED');
CREATE POLICY activities_admin_write ON "activities" FOR INSERT WITH CHECK (app_is_admin());
CREATE POLICY activities_admin_update ON "activities" FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY activities_admin_delete ON "activities" FOR DELETE USING (app_is_admin());

ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exercises" FORCE ROW LEVEL SECURITY;
CREATE POLICY exercises_public_select ON "exercises" FOR SELECT USING (true);
CREATE POLICY exercises_admin_write ON "exercises" FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

ALTER TABLE "quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quizzes" FORCE ROW LEVEL SECURITY;
CREATE POLICY quizzes_public_select ON "quizzes" FOR SELECT USING (true);
CREATE POLICY quizzes_admin_write ON "quizzes" FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" FORCE ROW LEVEL SECURITY;
CREATE POLICY questions_public_select ON "questions" FOR SELECT USING (true);
CREATE POLICY questions_admin_write ON "questions" FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

ALTER TABLE "answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "answers" FORCE ROW LEVEL SECURITY;
-- Pour les answers, on masque `is_correct` aux apprenants côté application
-- (projection DTO) ; la lecture SQL brute n'est pas utilisée en runtime.
CREATE POLICY answers_public_select ON "answers" FOR SELECT USING (true);
CREATE POLICY answers_admin_write ON "answers" FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Badges : définition publique mais critères détaillés admin-only via
-- projection DTO ; la RLS laisse passer la lecture pour alimenter la
-- galerie.
ALTER TABLE "badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "badges" FORCE ROW LEVEL SECURITY;
CREATE POLICY badges_public_select ON "badges"
FOR SELECT USING (app_is_admin() OR is_active = true);
CREATE POLICY badges_admin_write ON "badges" FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_versions" FORCE ROW LEVEL SECURITY;
CREATE POLICY content_versions_admin_only ON "content_versions"
FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());
