/**
 * Helpers de contrôle d'accès basés sur le rôle utilisateur.
 *
 * Les rôles sont définis dans l'enum Prisma `UserRole` (`@eduquiz/db`).
 * Ce module fournit des prédicats lisibles pour les routes et Server
 * Components, ainsi que des `requireRole`/`requireAnyRole` qui lèvent
 * une erreur typée — les routes peuvent intercepter et retourner un
 * 401/403, ou rediriger vers `/connexion`.
 */

import { UserRole } from '@eduquiz/db';

import type { AuthSessionUser } from './session.js';

export type { AuthSessionUser } from './session.js';

export class UnauthenticatedError extends Error {
  readonly code = 'UNAUTHENTICATED' as const;
  constructor(message = 'Authentification requise') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN' as const;
  constructor(message = 'Accès refusé') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export type AuthenticatedUser = NonNullable<AuthSessionUser>;

/**
 * Garde-fou : valide qu'un utilisateur est présent dans la session.
 * Utiliser dans les Server Components et Route Handlers nécessitant un
 * utilisateur (peu importe le rôle).
 */
export function requireUser(user: AuthSessionUser | null | undefined): AuthenticatedUser {
  if (!user) throw new UnauthenticatedError();
  return user;
}

/**
 * Vérifie qu'un utilisateur a un rôle précis. Si l'utilisateur a un
 * rôle hiérarchiquement supérieur (ADMIN), il passe quand même.
 */
export function requireRole(
  user: AuthSessionUser | null | undefined,
  expected: UserRole,
): AuthenticatedUser {
  const u = requireUser(user);
  if (u.role === expected || u.role === UserRole.ADMIN) return u;
  throw new ForbiddenError(`Rôle requis : ${expected}`);
}

/**
 * Vérifie qu'un utilisateur a un rôle parmi une liste.
 */
export function requireAnyRole(
  user: AuthSessionUser | null | undefined,
  allowed: readonly UserRole[],
): AuthenticatedUser {
  const u = requireUser(user);
  if (allowed.includes(u.role) || u.role === UserRole.ADMIN) return u;
  throw new ForbiddenError(`Rôle requis parmi : ${allowed.join(', ')}`);
}

export const isAdmin = (u: AuthSessionUser | null | undefined): boolean =>
  u?.role === UserRole.ADMIN;

export const isParent = (u: AuthSessionUser | null | undefined): boolean =>
  u?.role === UserRole.PARENT || u?.role === UserRole.ADMIN;

export const isLearner = (u: AuthSessionUser | null | undefined): boolean =>
  u?.role === UserRole.LEARNER_ADULT ||
  u?.role === UserRole.LEARNER_MINOR ||
  u?.role === UserRole.ADMIN;

/**
 * Vrai si le compte est utilisable : présent, vérifié, non désactivé,
 * non supprimé. À appeler en complément de `requireUser` lorsque
 * l'action implique du contenu produit (postage, achat, modification).
 */
export function isAccountActive(user: AuthSessionUser | null | undefined): boolean {
  if (!user) return false;
  if (user.disabledAt) return false;
  if (user.deletedAt) return false;
  return true;
}
