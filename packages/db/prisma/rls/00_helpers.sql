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
