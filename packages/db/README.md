# @eduquiz/db

Schéma de base de données et client Prisma partagés.

## Périmètre

- `prisma/schema.prisma` : schéma unique pour toutes les entités EduQuiz
  (User, ParentChildLink, ConsentRecord, Subject, Skill, Course, Lesson,
  LessonSkillLink, Activity, Exercise, Quiz, QuizQuestion, QuizAnswer,
  Attempt, Result, Progress, Reward, Badge, AuditLog, ContentVersion).
- `prisma/migrations/` : migrations SQL générées + migrations manuelles
  pour les Row Level Security policies et les triggers append-only.
- `src/` : client Prisma instancié, helpers RLS, helpers AuditLog.
- `seeds/` : jeux de données de développement (matières, leçons,
  exercices d'amorçage).

## Conventions

- Identifiants : UUID v7 partout.
- Tables PostgreSQL en `snake_case`, champs Prisma en `camelCase`.
- Contenus bilingues sur deux colonnes côte à côte
  (`titleFr`/`titleEn`, `contentFr`/`contentEn`).
- Toute mutation sensible passe par un trigger d'écriture dans
  `audit_log`.

## État actuel

Paquet scaffoldé (étape 0.1). Le schéma Prisma complet et les RLS
policies seront livrés à l'étape 0.3 de la Phase 0.
