# Modèle de données

## Entités principales

User, ParentChildLink, ConsentRecord, Subject, Skill, Course, Lesson,
LessonSkillLink, Activity, Exercise, Quiz, QuizQuestion, QuizAnswer, Attempt,
Result, Progress, Reward, Badge, AuditLog, ContentVersion.

## Règles strictes

- Tous les contenus sont bilingues (title_fr, title_en, content_fr, content_en)
- Les contenus sont versionnés via ContentVersion
- Attempt est immuable et horodaté
- ParentChildLink a 3 états : pending, verified, revoked
- ConsentRecord est immuable (IP, user-agent, timestamp)
- AuditLog capture toutes les actions sensibles

## Livrable attendu

Cowork produit `packages/db/prisma/schema.prisma` en Phase 0, incluant toutes
les RLS policies PostgreSQL.
