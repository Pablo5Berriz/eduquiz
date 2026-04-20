-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('LEARNER_ADULT', 'LEARNER_MINOR', 'PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "locale" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "grade_code" AS ENUM ('P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5');

-- CreateEnum
CREATE TYPE "school_cycle" AS ENUM ('PRIMAIRE', 'SECONDAIRE');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "activity_kind" AS ENUM ('EXERCISE', 'QUIZ');

-- CreateEnum
CREATE TYPE "exercise_type" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCHING', 'ORDERING', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "parent_link_state" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "consent_event_kind" AS ENUM ('CODE_GENERATED', 'CODE_SUBMITTED', 'PARENT_CONFIRMED', 'PARENT_REVOKED', 'ADMIN_REVOKED', 'TERMS_ACCEPTED', 'PRIVACY_ACCEPTED', 'MARKETING_OPTED_IN', 'MARKETING_OPTED_OUT');

-- CreateEnum
CREATE TYPE "audit_event_kind" AS ENUM ('AUTH_SIGNIN', 'AUTH_SIGNOUT', 'AUTH_FAILED', 'AUTH_PASSWORD_RESET', 'PROFILE_UPDATED', 'PARENT_LINK_CREATED', 'PARENT_LINK_VERIFIED', 'PARENT_LINK_REVOKED', 'CONSENT_GRANTED', 'CONSENT_REVOKED', 'CONTENT_CREATED', 'CONTENT_UPDATED', 'CONTENT_PUBLISHED', 'CONTENT_ARCHIVED', 'ATTEMPT_SUBMITTED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'SUBSCRIPTION_UPDATED', 'DATA_EXPORT_REQUESTED', 'DATA_EXPORT_DELIVERED', 'DATA_DELETION_REQUESTED', 'DATA_DELETION_EXECUTED', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "plan_code" AS ENUM ('FREE', 'INDIVIDUAL', 'FAMILY');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "data_request_status" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'AWAITING_GRACE_PERIOD', 'COMPLETED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "data_request_kind" AS ENUM ('EXPORT', 'DELETION');

-- CreateEnum
CREATE TYPE "incident_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "badge_kind" AS ENUM ('PROGRESSION', 'MASTERY', 'STREAK', 'EXPLORATION', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('PARENT_LINK_REQUEST', 'PARENT_LINK_CONFIRMED', 'PARENT_LINK_REVOKED', 'PROGRESS_MILESTONE', 'BADGE_EARNED', 'STREAK_REMINDER', 'WEEKLY_REPORT', 'CONTENT_NEW', 'PAYMENT_RECEIPT', 'DATA_REQUEST_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "versionable_kind" AS ENUM ('LESSON', 'EXERCISE', 'QUIZ', 'QUESTION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password_hash" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'LEARNER_ADULT',
    "locale" "locale" NOT NULL DEFAULT 'FR',
    "disabled_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "display_name" TEXT,
    "birth_date" DATE NOT NULL,
    "current_grade" "grade_code",
    "schoolCycle" "school_cycle",
    "avatar_url" TEXT,
    "preferred_locale" "locale" NOT NULL DEFAULT 'FR',
    "province" VARCHAR(2) NOT NULL DEFAULT 'QC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "parent_child_links" (
    "id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "invitation_code" CHAR(6) NOT NULL,
    "code_expires_at" TIMESTAMP(3) NOT NULL,
    "state" "parent_link_state" NOT NULL DEFAULT 'PENDING',
    "child_ip_address" INET,
    "child_user_agent" TEXT,
    "parent_ip_address" INET,
    "parent_user_agent" TEXT,
    "supervision_settings" JSONB NOT NULL DEFAULT '{}',
    "verified_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_child_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_user_id" UUID,
    "kind" "consent_event_kind" NOT NULL,
    "document_ref" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "target_id" UUID,
    "target_type" TEXT,
    "kind" "audit_event_kind" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "request_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_registers" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "reported_at" TIMESTAMP(3),
    "severity" "incident_severity" NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected_count" INTEGER NOT NULL DEFAULT 0,
    "contained_at" TIMESTAMP(3),
    "root_cause" TEXT,
    "remediation" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "data_request_kind" NOT NULL,
    "status" "data_request_status" NOT NULL DEFAULT 'REQUESTED',
    "format" TEXT,
    "artifact_url" TEXT,
    "artifact_expires_at" TIMESTAMP(3),
    "grace_expires_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_code" "plan_code" NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'TRIALING',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "stripe_payment_intent" TEXT,
    "receipt_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" UUID NOT NULL,
    "code" "grade_code" NOT NULL,
    "cycle" "school_cycle" NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_fr" TEXT,
    "description_en" TEXT,
    "color_token" TEXT,
    "icon_name" TEXT,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_fr" TEXT,
    "description_en" TEXT,
    "grade_codes" "grade_code"[],
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title_fr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "description_fr" TEXT,
    "description_en" TEXT,
    "cover_image_url" TEXT,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title_fr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "summary_fr" TEXT,
    "summary_en" TEXT,
    "body_fr" JSONB NOT NULL DEFAULT '{}',
    "body_en" JSONB NOT NULL DEFAULT '{}',
    "objectives_fr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives_en" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords_fr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords_en" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 0,
    "published_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_skill_links" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_skill_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "kind" "activity_kind" NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "passing_score" INTEGER,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "type" "exercise_type" NOT NULL,
    "difficulty" "difficulty" NOT NULL DEFAULT 'MEDIUM',
    "title_fr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "instructions_fr" TEXT NOT NULL,
    "instructions_en" TEXT NOT NULL,
    "hint_fr" TEXT,
    "hint_en" TEXT,
    "explanation_fr" TEXT,
    "explanation_en" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "points" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "difficulty" "difficulty" NOT NULL DEFAULT 'MEDIUM',
    "title_fr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "introduction_fr" TEXT,
    "introduction_en" TEXT,
    "time_limit_seconds" INTEGER,
    "allow_skip" BOOLEAN NOT NULL DEFAULT false,
    "randomize" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "exercise_id" UUID,
    "quiz_id" UUID,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "prompt_fr" TEXT NOT NULL,
    "prompt_en" TEXT NOT NULL,
    "type" "exercise_type" NOT NULL,
    "difficulty" "difficulty" NOT NULL DEFAULT 'MEDIUM',
    "data" JSONB NOT NULL DEFAULT '{}',
    "explanation_fr" TEXT,
    "explanation_en" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "label_fr" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "pair_value_fr" TEXT,
    "pair_value_en" TEXT,
    "feedback_fr" TEXT,
    "feedback_en" TEXT,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "raw_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "activity_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "response" JSONB NOT NULL DEFAULT '{}',
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "kind" "badge_kind" NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "icon_url" TEXT,
    "skill_id" UUID,
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_id" UUID,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "last_day_local" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "title_fr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "body_fr" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "href" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" UUID NOT NULL,
    "versionable_kind" "versionable_kind" NOT NULL,
    "versionable_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "author_id" UUID,
    "reviewer_id" UUID,
    "change_note" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_disabled_at_idx" ON "users"("disabled_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_current_grade_idx" ON "profiles"("current_grade");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "parent_child_links_state_idx" ON "parent_child_links"("state");

-- CreateIndex
CREATE INDEX "parent_child_links_code_expires_at_idx" ON "parent_child_links"("code_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "parent_child_links_parent_id_child_id_key" ON "parent_child_links"("parent_id", "child_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_child_links_invitation_code_key" ON "parent_child_links"("invitation_code");

-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");

-- CreateIndex
CREATE INDEX "consent_records_subject_user_id_idx" ON "consent_records"("subject_user_id");

-- CreateIndex
CREATE INDEX "consent_records_kind_idx" ON "consent_records"("kind");

-- CreateIndex
CREATE INDEX "consent_records_recorded_at_idx" ON "consent_records"("recorded_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "audit_logs_kind_idx" ON "audit_logs"("kind");

-- CreateIndex
CREATE INDEX "audit_logs_recorded_at_idx" ON "audit_logs"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "incident_registers_reference_key" ON "incident_registers"("reference");

-- CreateIndex
CREATE INDEX "incident_registers_severity_idx" ON "incident_registers"("severity");

-- CreateIndex
CREATE INDEX "incident_registers_occurred_at_idx" ON "incident_registers"("occurred_at");

-- CreateIndex
CREATE INDEX "data_requests_user_id_idx" ON "data_requests"("user_id");

-- CreateIndex
CREATE INDEX "data_requests_status_idx" ON "data_requests"("status");

-- CreateIndex
CREATE INDEX "data_requests_grace_expires_at_idx" ON "data_requests"("grace_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_code_idx" ON "subscriptions"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_key" ON "payments"("stripe_payment_intent");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "levels_code_key" ON "levels"("code");

-- CreateIndex
CREATE INDEX "levels_cycle_idx" ON "levels"("cycle");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_is_published_idx" ON "subjects"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- CreateIndex
CREATE INDEX "skills_subject_id_idx" ON "skills"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_subject_id_level_id_idx" ON "courses"("subject_id", "level_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE INDEX "lessons_course_id_idx" ON "lessons"("course_id");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "lesson_skill_links_skill_id_idx" ON "lesson_skill_links"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_skill_links_lesson_id_skill_id_key" ON "lesson_skill_links"("lesson_id", "skill_id");

-- CreateIndex
CREATE INDEX "activities_lesson_id_idx" ON "activities"("lesson_id");

-- CreateIndex
CREATE INDEX "activities_kind_idx" ON "activities"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_activity_id_key" ON "exercises"("activity_id");

-- CreateIndex
CREATE INDEX "exercises_type_idx" ON "exercises"("type");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_activity_id_key" ON "quizzes"("activity_id");

-- CreateIndex
CREATE INDEX "questions_exercise_id_idx" ON "questions"("exercise_id");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE INDEX "attempts_user_id_submitted_at_idx" ON "attempts"("user_id", "submitted_at");

-- CreateIndex
CREATE INDEX "attempts_activity_id_idx" ON "attempts"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attempt_id_question_id_key" ON "attempt_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "progress_user_id_idx" ON "progress"("user_id");

-- CreateIndex
CREATE INDEX "progress_skill_id_idx" ON "progress"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_user_id_skill_id_key" ON "progress"("user_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE INDEX "badges_kind_idx" ON "badges"("kind");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_user_id_key" ON "streaks"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_kind_idx" ON "notifications"("kind");

-- CreateIndex
CREATE INDEX "content_versions_versionable_kind_versionable_id_idx" ON "content_versions"("versionable_kind", "versionable_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_versionable_kind_versionable_id_version_key" ON "content_versions"("versionable_kind", "versionable_id", "version");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_skill_links" ADD CONSTRAINT "lesson_skill_links_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_skill_links" ADD CONSTRAINT "lesson_skill_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

