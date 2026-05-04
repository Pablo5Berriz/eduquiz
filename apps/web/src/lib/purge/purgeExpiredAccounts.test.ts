/**
 * Tests unitaires — purgeExpiredAccounts
 *
 * Prisma est mocké entièrement : aucune DB réelle nécessaire.
 * On vérifie le comportement observable : quelles méthodes Prisma sont
 * appelées, avec quels arguments, et quel résultat est retourné.
 */

import { AuditEventKind, DataRequestKind, DataRequestStatus } from '@eduquiz/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock @eduquiz/db ────────────────────────────────────────────────────────

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@eduquiz/db', async (importOriginal) => {
  const original = await importOriginal<typeof import('@eduquiz/db')>();
  return {
    ...original,
    prisma: {
      dataRequest: { findMany: mockFindMany, update: mockUpdate },
      user: { update: mockUpdate },
      profile: { deleteMany: mockDeleteMany },
      account: { deleteMany: mockDeleteMany },
      session: { deleteMany: mockDeleteMany },
      auditLog: { create: mockCreate },
      $transaction: mockTransaction,
    },
  };
});

// ─── Mock logger ─────────────────────────────────────────────────────────────

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── Subject ─────────────────────────────────────────────────────────────────

import { purgeExpiredAccounts } from './purgeExpiredAccounts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-01T03:00:00.000Z');

function makeExpiredRequest(overrides: { id?: string; userId?: string } = {}) {
  return {
    id: overrides.id ?? 'req-1',
    userId: overrides.userId ?? 'user-1',
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('purgeExpiredAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Par défaut, $transaction exécute le callback immédiatement avec un tx proxy.
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        user: { update: vi.fn().mockResolvedValue(undefined) },
        profile: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        account: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        session: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        dataRequest: { update: vi.fn().mockResolvedValue(undefined) },
        auditLog: { create: vi.fn().mockResolvedValue(undefined) },
      };
      await cb(tx);
      return tx; // expose le tx pour les assertions si besoin
    });
  });

  // ── Cas nominal : aucun compte expiré ───────────────────────────────────────

  it('retourne { purged: 0, errors: 0 } quand aucun DataRequest expiré', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await purgeExpiredAccounts(NOW);

    expect(result).toEqual({ purged: 0, errors: 0 });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // ── Cas nominal : un compte à purger ────────────────────────────────────────

  it('purge un compte expiré et retourne { purged: 1, errors: 0 }', async () => {
    const req = makeExpiredRequest();
    mockFindMany.mockResolvedValue([req]);

    const result = await purgeExpiredAccounts(NOW);

    expect(result).toEqual({ purged: 1, errors: 0 });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('interroge la DB avec les bons filtres', async () => {
    mockFindMany.mockResolvedValue([]);

    await purgeExpiredAccounts(NOW);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        kind: DataRequestKind.DELETION,
        status: DataRequestStatus.AWAITING_GRACE_PERIOD,
        graceExpiresAt: { lte: NOW },
      },
      select: { id: true, userId: true },
    });
  });

  it('exécute les 6 étapes dans la transaction', async () => {
    const req = makeExpiredRequest({ id: 'req-42', userId: 'user-99' });
    mockFindMany.mockResolvedValue([req]);

    let capturedTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        user: { update: vi.fn().mockResolvedValue(undefined) },
        profile: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        account: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        session: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        dataRequest: { update: vi.fn().mockResolvedValue(undefined) },
        auditLog: { create: vi.fn().mockResolvedValue(undefined) },
      };
      capturedTx = tx as typeof capturedTx;
      await cb(tx);
    });

    await purgeExpiredAccounts(NOW);

    // 1. Anonymisation User
    expect(capturedTx!.user.update).toHaveBeenCalledWith({
      where: { id: 'user-99' },
      data: {
        email: 'deleted-user-99@purged.invalid',
        passwordHash: null,
        deletedAt: NOW,
        sessionVersion: { increment: 1 },
      },
    });

    // 2. Hard-delete Profile
    expect(capturedTx!.profile.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-99' } });

    // 3. Hard-delete Account OAuth
    expect(capturedTx!.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-99' } });

    // 4. Hard-delete Sessions
    expect(capturedTx!.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-99' } });

    // 5. DataRequest → COMPLETED
    expect(capturedTx!.dataRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-42' },
      data: {
        status: DataRequestStatus.COMPLETED,
        completedAt: NOW,
      },
    });

    // 6. AuditLog DATA_DELETION_EXECUTED
    expect(capturedTx!.auditLog.create).toHaveBeenCalledWith({
      data: {
        kind: AuditEventKind.DATA_DELETION_EXECUTED,
        actorId: null,
        targetId: 'user-99',
        targetType: 'user',
        payload: { dataRequestId: 'req-42' },
      },
    });
  });

  // ── Comptes multiples ────────────────────────────────────────────────────────

  it('traite plusieurs comptes indépendamment', async () => {
    mockFindMany.mockResolvedValue([
      makeExpiredRequest({ id: 'req-1', userId: 'user-1' }),
      makeExpiredRequest({ id: 'req-2', userId: 'user-2' }),
    ]);

    const result = await purgeExpiredAccounts(NOW);

    expect(result).toEqual({ purged: 2, errors: 0 });
    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });

  // ── Résilience aux erreurs ───────────────────────────────────────────────────

  it('compte une erreur sans bloquer les autres utilisateurs', async () => {
    mockFindMany.mockResolvedValue([
      makeExpiredRequest({ id: 'req-1', userId: 'user-1' }),
      makeExpiredRequest({ id: 'req-2', userId: 'user-2' }),
    ]);

    let callCount = 0;
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      callCount++;
      if (callCount === 1) throw new Error('DB timeout');
      const tx = {
        user: { update: vi.fn().mockResolvedValue(undefined) },
        profile: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        account: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        session: { deleteMany: vi.fn().mockResolvedValue(undefined) },
        dataRequest: { update: vi.fn().mockResolvedValue(undefined) },
        auditLog: { create: vi.fn().mockResolvedValue(undefined) },
      };
      await cb(tx);
    });

    const result = await purgeExpiredAccounts(NOW);

    expect(result).toEqual({ purged: 1, errors: 1 });
  });

  it('retourne { errors: 1 } si la transaction échoue complètement', async () => {
    mockFindMany.mockResolvedValue([makeExpiredRequest()]);
    mockTransaction.mockRejectedValue(new Error('connection lost'));

    const result = await purgeExpiredAccounts(NOW);

    expect(result).toEqual({ purged: 0, errors: 1 });
  });
});
