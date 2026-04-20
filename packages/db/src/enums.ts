/**
 * Ré-export des enums Prisma pour usage applicatif.
 *
 * Ce module est importé par les apps et paquets qui doivent comparer ou
 * sérialiser des valeurs d'enum (Zod, DTO, UI) sans avoir à importer
 * l'ensemble du client Prisma. Aligné sur `packages/db/prisma/schema.prisma`.
 */

export {
  ActivityKind,
  AuditEventKind,
  BadgeKind,
  ConsentEventKind,
  ContentStatus,
  DataRequestKind,
  DataRequestStatus,
  Difficulty,
  ExerciseType,
  GradeCode,
  IncidentSeverity,
  Locale,
  NotificationKind,
  ParentLinkState,
  PaymentStatus,
  PlanCode,
  SchoolCycle,
  SubscriptionStatus,
  UserRole,
  VersionableKind,
} from './generated/client/index.js';
