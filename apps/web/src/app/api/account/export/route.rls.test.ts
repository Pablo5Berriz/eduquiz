/**
 * Integration PostgreSQL/RLS - GET /api/account/export.
 *
 * These tests are opt-in. They require DATABASE_URL_TEST_RLS to point to a
 * migrated, disposable PostgreSQL database with RLS policies enabled.
 */

import { randomUUID } from 'node:crypto';

import { AuditEventKind, DataRequestKind, DataRequestStatus, PrismaClient } from '@eduquiz/db';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

import type { Prisma, RlsContext } from '@eduquiz/db';

const {
  MockForbiddenError,
  MockUnauthenticatedError,
  mockRequireApiUser,
  rlsState,
  testDbUrl,
  unsafeDbReason,
} = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {
    constructor() {
      super('unauthenticated');
      this.name = 'UnauthenticatedError';
    }
  }

  class MockForbiddenError extends Error {
    constructor() {
      super('forbidden');
      this.name = 'ForbiddenError';
    }
  }

  function getUnsafeDbReason(rawUrl: string | undefined): string | null {
    if (!rawUrl) return null;

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return 'DATABASE_URL_TEST_RLS is not a valid URL';
    }

    const hostname = parsed.hostname.toLowerCase();
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, '')).toLowerCase();
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

    if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
      return 'DATABASE_URL_TEST_RLS must use a PostgreSQL URL';
    }
    if (!localHosts.has(hostname)) {
      return `DATABASE_URL_TEST_RLS host must be local, got "${parsed.hostname}"`;
    }
    if (!database.includes('test')) {
      return `DATABASE_URL_TEST_RLS database name must contain "test", got "${database}"`;
    }
    if (/(prod|production|staging)/i.test(rawUrl)) {
      return 'DATABASE_URL_TEST_RLS looks like a non-test environment';
    }

    return null;
  }

  return {
    MockForbiddenError,
    MockUnauthenticatedError,
    mockRequireApiUser: vi.fn(),
    rlsState: { activeTx: null as Prisma.TransactionClient | null },
    testDbUrl: process.env.DATABASE_URL_TEST_RLS,
    unsafeDbReason: getUnsafeDbReason(process.env.DATABASE_URL_TEST_RLS),
  };
});

vi.mock('@eduquiz/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@eduquiz/db')>();

  return {
    ...actual,
    withUser: (ctx: RlsContext) => ({
      $transaction: async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
        if (!rlsState.activeTx) {
          throw new Error('RLS integration test transaction is not active');
        }

        await rlsState.activeTx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_id', $1, true)`,
          ctx.userId,
        );
        await rlsState.activeTx.$executeRawUnsafe(
          `SELECT set_config('app.current_role', $1, true)`,
          ctx.role,
        );

        return fn(rlsState.activeTx);
      },
    }),
  };
});

vi.mock('../../../../lib/auth/server', () => ({
  requireApiUser: mockRequireApiUser,
  UnauthenticatedError: MockUnauthenticatedError,
  ForbiddenError: MockForbiddenError,
}));

const describeRls = testDbUrl ? describe : describe.skip;

class RollbackTestTransaction extends Error {
  constructor() {
    super('rollback rls integration test');
  }
}

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  marker: string;
}

let db: PrismaClient | null = null;

beforeAll(() => {
  if (!testDbUrl) return;
  if (unsafeDbReason) {
    throw new Error(unsafeDbReason);
  }

  db = new PrismaClient({ datasourceUrl: testDbUrl });
});

afterAll(async () => {
  await db?.$disconnect();
});

function makeRequest(): Request {
  return new Request('http://localhost/api/account/export?format=json&locale=fr');
}

function makeUsers(): { a: TestUser; b: TestUser; adminId: string } {
  const runId = randomUUID();
  return {
    adminId: randomUUID(),
    a: {
      id: randomUUID(),
      email: `rls-a-${runId}@example.test`,
      firstName: `RlsAlpha${runId.slice(0, 8)}`,
      marker: `marker-a-${runId}`,
    },
    b: {
      id: randomUUID(),
      email: `rls-b-${runId}@example.test`,
      firstName: `RlsBeta${runId.slice(0, 8)}`,
      marker: `marker-b-${runId}`,
    },
  };
}

async function setRlsContext(
  tx: Prisma.TransactionClient,
  userId: string,
  role: 'LEARNER_ADULT' | 'ADMIN',
): Promise<void> {
  await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true)`, userId);
  await tx.$executeRawUnsafe(`SELECT set_config('app.current_role', $1, true)`, role);
}

async function seedUserPair(
  tx: Prisma.TransactionClient,
  users: { a: TestUser; b: TestUser; adminId: string },
): Promise<void> {
  await setRlsContext(tx, users.adminId, 'ADMIN');

  for (const user of [users.a, users.b]) {
    await tx.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: 'LEARNER_ADULT',
        locale: 'FR',
      },
    });
    await tx.profile.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: `Last-${user.marker}`,
        birthDate: new Date('2000-01-01T00:00:00.000Z'),
        province: 'QC',
      },
    });
    await tx.consentRecord.create({
      data: {
        userId: user.id,
        kind: 'PRIVACY_ACCEPTED',
        documentRef: `privacy-${user.marker}`,
        payload: { marker: user.marker, source: 'rls-export-test' },
      },
    });
    await tx.auditLog.create({
      data: {
        kind: 'CONSENT_GRANTED',
        actorId: user.id,
        targetId: user.id,
        targetType: 'user',
        payload: { marker: user.marker, source: 'rls-export-test' },
      },
    });
    await tx.dataRequest.create({
      data: {
        userId: user.id,
        kind: 'EXPORT',
        status: 'COMPLETED',
        format: `SEED-${user.marker}`,
        completedAt: new Date(),
        metadata: { marker: user.marker, source: 'rls-export-test' },
      },
    });
  }
}

async function runRolledBack(fn: (tx: Prisma.TransactionClient) => Promise<void>): Promise<void> {
  if (!db) throw new Error('DATABASE_URL_TEST_RLS is required for RLS integration tests');

  try {
    await db.$transaction(
      async (tx) => {
        rlsState.activeTx = tx;
        await fn(tx);
        throw new RollbackTestTransaction();
      },
      { timeout: 20_000 },
    );
  } catch (error) {
    if (!(error instanceof RollbackTestTransaction)) throw error;
  } finally {
    rlsState.activeTx = null;
  }
}

async function assertJsonExportIsolation(
  tx: Prisma.TransactionClient,
  current: TestUser,
  other: TestUser,
): Promise<void> {
  mockRequireApiUser.mockResolvedValue({ id: current.id, role: 'LEARNER_ADULT' });

  const res = await GET(makeRequest());
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toMatch(/application\/json/);

  const text = await res.text();
  expect(text).toContain(current.email);
  expect(text).toContain(current.firstName);
  expect(text).toContain(current.marker);
  expect(text).not.toContain(other.email);
  expect(text).not.toContain(other.firstName);
  expect(text).not.toContain(other.marker);

  const body = JSON.parse(text) as {
    account: { id: string; email: string } | null;
    profile: { firstName: string } | null;
    consents: unknown[];
    auditLog: unknown[];
    dataRequests: unknown[];
  };

  expect(body.account?.id).toBe(current.id);
  expect(body.account?.email).toBe(current.email);
  expect(body.profile?.firstName).toBe(current.firstName);
  expect(body.consents.length).toBeGreaterThan(0);
  expect(body.auditLog.length).toBeGreaterThan(0);
  expect(body.dataRequests.length).toBeGreaterThan(0);

  await setRlsContext(tx, randomUUID(), 'ADMIN');

  const currentTraceRequests = await tx.dataRequest.findMany({
    where: {
      userId: current.id,
      kind: DataRequestKind.EXPORT,
      status: DataRequestStatus.COMPLETED,
      format: 'JSON',
    },
  });
  const otherTraceRequests = await tx.dataRequest.findMany({
    where: {
      userId: other.id,
      kind: DataRequestKind.EXPORT,
      status: DataRequestStatus.COMPLETED,
      format: 'JSON',
    },
  });
  const currentTraceAudits = await tx.auditLog.findMany({
    where: {
      actorId: current.id,
      targetId: current.id,
      kind: AuditEventKind.DATA_EXPORT_DELIVERED,
    },
  });
  const otherTraceAudits = await tx.auditLog.findMany({
    where: {
      actorId: other.id,
      targetId: other.id,
      kind: AuditEventKind.DATA_EXPORT_DELIVERED,
    },
  });

  expect(currentTraceRequests).toHaveLength(1);
  expect(otherTraceRequests).toHaveLength(0);
  expect(currentTraceAudits).toHaveLength(1);
  expect(otherTraceAudits).toHaveLength(0);
}

describeRls(
  'GET /api/account/export PostgreSQL RLS integration (skipped unless DATABASE_URL_TEST_RLS is set)',
  () => {
    it('exports JSON for user A without leaking user B data', async () => {
      await runRolledBack(async (tx) => {
        const users = makeUsers();
        await seedUserPair(tx, users);
        await assertJsonExportIsolation(tx, users.a, users.b);
      });
    });

    it('exports JSON for user B without leaking user A data', async () => {
      await runRolledBack(async (tx) => {
        const users = makeUsers();
        await seedUserPair(tx, users);
        await assertJsonExportIsolation(tx, users.b, users.a);
      });
    });
  },
);
