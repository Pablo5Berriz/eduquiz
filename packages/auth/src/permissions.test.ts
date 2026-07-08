/**
 * Tests unit du module `permissions.ts` — purement stateless, pas de
 * mock nécessaire.
 */

import { UserRole } from '@eduquiz/db';
import { describe, expect, it } from 'vitest';

import {
  ForbiddenError,
  UnauthenticatedError,
  isAccountActive,
  isAdmin,
  isLearner,
  isParent,
  requireAnyRole,
  requireRole,
  requireUser,
  type AuthSessionUser,
} from './permissions.js';

function makeUser(role: UserRole, overrides: Partial<AuthSessionUser> = {}): AuthSessionUser {
  return {
    id: 'u1',
    email: 'a@b.c',
    name: null,
    image: null,
    role,
    locale: 'FR' as never,
    emailVerifiedAt: new Date(),
    disabledAt: null,
    deletedAt: null,
    sessionVersion: 0,
    ...overrides,
  };
}

describe('requireUser', () => {
  it('lève si null/undefined', () => {
    expect(() => requireUser(null)).toThrow(UnauthenticatedError);
    expect(() => requireUser(undefined)).toThrow(UnauthenticatedError);
  });
  it('retourne l’utilisateur sinon', () => {
    const u = makeUser(UserRole.LEARNER_ADULT);
    expect(requireUser(u)).toBe(u);
  });
});

describe('requireRole / requireAnyRole', () => {
  it('passe si rôle exact', () => {
    const u = makeUser(UserRole.PARENT);
    expect(requireRole(u, UserRole.PARENT).id).toBe('u1');
  });

  it('ADMIN passe pour tous les rôles requis', () => {
    const u = makeUser(UserRole.ADMIN);
    expect(requireRole(u, UserRole.LEARNER_ADULT).id).toBe('u1');
    expect(requireRole(u, UserRole.PARENT).id).toBe('u1');
  });

  it('lève ForbiddenError si rôle non aligné', () => {
    const u = makeUser(UserRole.LEARNER_ADULT);
    expect(() => requireRole(u, UserRole.PARENT)).toThrow(ForbiddenError);
  });

  it('requireAnyRole accepte une liste', () => {
    const u = makeUser(UserRole.PARENT);
    expect(requireAnyRole(u, [UserRole.PARENT, UserRole.LEARNER_ADULT]).id).toBe('u1');
    expect(() => requireAnyRole(u, [UserRole.ADMIN])).toThrow(ForbiddenError);
  });
});

describe('prédicats isXxx', () => {
  it('isAdmin / isParent / isLearner', () => {
    expect(isAdmin(makeUser(UserRole.ADMIN))).toBe(true);
    expect(isAdmin(makeUser(UserRole.PARENT))).toBe(false);
    expect(isParent(makeUser(UserRole.PARENT))).toBe(true);
    expect(isParent(makeUser(UserRole.ADMIN))).toBe(true);
    expect(isLearner(makeUser(UserRole.LEARNER_ADULT))).toBe(true);
    expect(isLearner(makeUser(UserRole.LEARNER_MINOR))).toBe(true);
    expect(isLearner(null)).toBe(false);
  });
});

describe('isAccountActive', () => {
  it('false si null/disabled/deleted', () => {
    expect(isAccountActive(null)).toBe(false);
    expect(isAccountActive(makeUser(UserRole.LEARNER_ADULT, { disabledAt: new Date() }))).toBe(false);
    expect(isAccountActive(makeUser(UserRole.LEARNER_ADULT, { deletedAt: new Date() }))).toBe(false);
  });
  it('true sinon', () => {
    expect(isAccountActive(makeUser(UserRole.LEARNER_ADULT))).toBe(true);
  });
});
