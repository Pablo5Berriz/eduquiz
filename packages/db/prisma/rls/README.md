# EduQuiz — Row Level Security

Ce dossier regroupe, par domaine fonctionnel, les politiques Row Level Security
(RLS) appliquées sur la base PostgreSQL d'EduQuiz. Les fichiers sont numérotés
pour que l'ordre d'application soit explicite :

1. `00_helpers.sql` — fonctions utilitaires (`app_current_user_id()`,
   `app_current_role()`, `app_is_admin()`, `app_is_verified_parent_of()`).
2. `10_identity.sql` — `users`, `profiles`, `accounts`, `sessions`.
3. `20_parenting.sql` — `parent_child_links`.
4. `30_consent_audit.sql` — `consent_records`, `audit_logs`,
   `incident_registers`, `data_requests`.
5. `40_billing.sql` — `subscriptions`, `payments`.
6. `50_learning.sql` — `attempts`, `attempt_answers`, `progress`, `user_badges`,
   `streaks`.
7. `60_communications.sql` — `notifications`.
8. `70_catalogue.sql` — `levels`, `subjects`, `skills`, `courses`, `lessons`,
   `lesson_skill_links`, `activities`, `exercises`, `quizzes`, `questions`,
   `answers`, `badges`, `content_versions`.

## Mode d'emploi côté application

Chaque requête applicative doit ouvrir une transaction Postgres et y positionner
les variables de session :

```sql
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_role    = '<LEARNER_ADULT|LEARNER_MINOR|PARENT|ADMIN>';
SET LOCAL app.current_request_id = '<correlation-id>'; -- optionnel, logs
```

Côté Prisma, c'est le rôle du `PrismaClient` `withUser(userId, role)` exposé par
`packages/db/src/client.ts` (étape 0.3.4) : il ouvre une transaction, injecte
les `SET LOCAL`, puis relaie les requêtes.

## Source de vérité vs. migration

La migration Prisma `prisma/migrations/20260419220200_rls/migration.sql`
contient la même SQL, concaténée dans l'ordre indiqué ci-dessus. Toute
modification doit être répercutée manuellement dans les deux endroits (test
automatisé à venir en phase 4). En cas de divergence, c'est la migration qui
fait foi (c'est elle qui est déployée).
