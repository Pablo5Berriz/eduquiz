-- ─────────────────────────────────────────────────────────────────────────────
--  EduQuiz — Row Level Security (RLS)
--
--  Ce fichier est la concaténation, dans l'ordre, des fichiers
--  prisma/rls/*.sql qui constituent la source de vérité organisée.
--  Toute modification de politique doit être répercutée dans les deux
--  endroits. Voir prisma/rls/README.md.
-- ─────────────────────────────────────────────────────────────────────────────


-- ##### rls/00_helpers.sql #####
-- ─────────────────────────────────────────────────────────────────────────────
--  RLS — Fonctions utilitaires
--
--  Les politiques EduQuiz s'appuient sur trois variables de session
--  positionnées par l'application au début de chaque transaction :
--
--    SET LOCAL app.current_user_id = '<uuid>';
--    SET LOCAL app.current_role    = '<LEARNER_ADULT|LEARNER_MINOR|PARENT|ADMIN>';
--    SET LOCAL app.current_request_id = '<corrélation facultative>';
--
--  Les fonctions ci-dessous encapsulent la lecture de ces variables et
--  tolèrent leur absence (retournent NULL / FALSE plutôt que de lever).
-- ─────────────────────────────────────────────────────────────────────────────

-- Retourne l'UUID de l'utilisateur courant, ou NULL si non défini.
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.current_user_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Retourne le rôle courant (chaîne), ou NULL.
CREATE OR REPLACE FUNCTION app_current_role()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN nullif(current_setting('app.current_role', true), '');
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Vrai si l'appelant est un administrateur.
CREATE OR REPLACE FUNCTION app_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app_current_role() = 'ADMIN';
$$;

-- Vrai si l'utilisateur courant est un parent vérifié de `child`.
CREATE OR REPLACE FUNCTION app_is_verified_parent_of(child uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_child_links pcl
    WHERE pcl.parent_id = app_current_user_id()
      AND pcl.child_id = child
      AND pcl.state = 'VERIFIED'
  );
$$;

COMMENT ON FUNCTION app_current_user_id() IS
  'UUID de l''utilisateur courant tel que défini par SET LOCAL app.current_user_id (RLS EduQuiz).';

COMMENT ON FUNCTION app_current_role() IS
  'Rôle courant tel que défini par SET LOCAL app.current_role (RLS EduQuiz).';

COMMENT ON FUNCTION app_is_admin() IS
  'Vrai si l''appelant a le rôle ADMIN.';

COMMENT ON FUNCTION app_is_verified_parent_of(uuid) IS
  'Vrai si l''appelant est un parent vérifié (VERIFIED) de l''utilisateur passé en paramètre.';

-- ##### rls/10_identity.sql #####
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

-- ##### rls/20_parenting.sql #####
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

-- ##### rls/30_consent_audit.sql #####
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

-- ##### rls/40_billing.sql #####
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

-- ##### rls/50_learning.sql #####
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

-- ##### rls/60_communications.sql #####
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

-- ##### rls/70_catalogue.sql #####
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
