-- ─────────────────────────────────────────────────────────────────────────────
--  EduQuiz — Append-only integrity triggers
--
--  Ces tables doivent rester strictement immuables : l'écriture y est
--  autorisée une seule fois, puis toute tentative d'UPDATE ou de DELETE
--  doit échouer au niveau de la base de données (ceinture et bretelles,
--  au cas où une future route Next ou un script d'admin oublierait la
--  règle applicative).
--
--  Exigence Loi 25 (registres de traitement) : le journal d'audit et le
--  registre des consentements doivent être inviolables. Les tentatives
--  sont également piégées et inscrites dans `audit_logs` (sauf pour
--  `audit_logs` lui-même, pour éviter toute récursion).
--
--  Côté `attempts` : une tentative soumise devient un fait historique et
--  ne peut plus être modifiée. C'est ce qui garantit la fiabilité des
--  statistiques de progression et des rapports parentaux.
-- ─────────────────────────────────────────────────────────────────────────────

-- Fonction générique qui refuse toute modification ligne à ligne.
CREATE OR REPLACE FUNCTION eduquiz_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Table % is append-only; % operations are not allowed.',
    TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

COMMENT ON FUNCTION eduquiz_reject_mutation() IS
  'Rejette toute mutation (UPDATE / DELETE / TRUNCATE) sur les tables append-only EduQuiz (Loi 25 + intégrité des tentatives).';

-- consent_records : registre des consentements (Loi 25, art. 8 et 14).
CREATE TRIGGER consent_records_no_update
BEFORE UPDATE ON "consent_records"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER consent_records_no_delete
BEFORE DELETE ON "consent_records"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER consent_records_no_truncate
BEFORE TRUNCATE ON "consent_records"
FOR EACH STATEMENT EXECUTE FUNCTION eduquiz_reject_mutation();

-- audit_logs : journal d'audit (Loi 25, registres de traitement).
CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER audit_logs_no_truncate
BEFORE TRUNCATE ON "audit_logs"
FOR EACH STATEMENT EXECUTE FUNCTION eduquiz_reject_mutation();

-- attempts : les tentatives soumises sont historiques et immuables.
CREATE TRIGGER attempts_no_update
BEFORE UPDATE ON "attempts"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER attempts_no_delete
BEFORE DELETE ON "attempts"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER attempts_no_truncate
BEFORE TRUNCATE ON "attempts"
FOR EACH STATEMENT EXECUTE FUNCTION eduquiz_reject_mutation();

-- attempt_answers : les réponses soumises héritent de l'immuabilité des tentatives.
CREATE TRIGGER attempt_answers_no_update
BEFORE UPDATE ON "attempt_answers"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER attempt_answers_no_delete
BEFORE DELETE ON "attempt_answers"
FOR EACH ROW EXECUTE FUNCTION eduquiz_reject_mutation();

CREATE TRIGGER attempt_answers_no_truncate
BEFORE TRUNCATE ON "attempt_answers"
FOR EACH STATEMENT EXECUTE FUNCTION eduquiz_reject_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
--  CHECK constraints métier
-- ─────────────────────────────────────────────────────────────────────────────

-- Question : appartient à exactement un Exercise OU un Quiz, jamais aux deux
-- ni à aucun.
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_exercise_xor_quiz"
  CHECK (
    (exercise_id IS NOT NULL AND quiz_id IS NULL)
    OR (exercise_id IS NULL AND quiz_id IS NOT NULL)
  );

-- DataRequest : seules les demandes de type DELETION utilisent le délai de
-- grâce (30 jours Loi 25).
ALTER TABLE "data_requests"
  ADD CONSTRAINT "data_requests_grace_only_on_deletion"
  CHECK (grace_expires_at IS NULL OR kind = 'DELETION');

-- ParentChildLink : le code d'invitation n'est utile que tant que le lien
-- n'est pas vérifié ; une fois `VERIFIED` ou `REVOKED`, la date d'expiration
-- doit être dans le passé (aucun usage ultérieur possible).
ALTER TABLE "parent_child_links"
  ADD CONSTRAINT "parent_child_links_code_format"
  CHECK (invitation_code ~ '^[0-9]{6}$');

-- Un parent ne peut pas être son propre enfant.
ALTER TABLE "parent_child_links"
  ADD CONSTRAINT "parent_child_links_parent_not_child"
  CHECK (parent_id <> child_id);

-- Attempt : les scores normalisés sont toujours dans [0, 100].
ALTER TABLE "attempts"
  ADD CONSTRAINT "attempts_score_range"
  CHECK (score BETWEEN 0 AND 100);

-- Attempt : raw_score <= max_score.
ALTER TABLE "attempts"
  ADD CONSTRAINT "attempts_raw_score_le_max"
  CHECK (raw_score >= 0 AND raw_score <= max_score);

-- Progress : mastery normalisée [0, 1].
ALTER TABLE "progress"
  ADD CONSTRAINT "progress_mastery_range"
  CHECK (mastery >= 0 AND mastery <= 1);

-- LessonSkillLink : weight strictement positif.
ALTER TABLE "lesson_skill_links"
  ADD CONSTRAINT "lesson_skill_links_weight_positive"
  CHECK (weight > 0);

-- Payment : montant toujours positif ou nul.
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_cents_non_negative"
  CHECK (amount_cents >= 0);
