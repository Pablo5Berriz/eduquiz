/**
 * Tests unitaires — GET /api/account/export
 *
 * Vérifie :
 *   1. 401 si non authentifié
 *   2. Export JSON — en-têtes et structure du payload
 *   3. Export PDF — en-tête Content-Type
 *   4. L'échec de la trace (best-effort) ne bloque pas l'export
 *   5. withUser est appelé avec le bon contexte RLS pour les lectures
 *   6. withUser est appelé une seconde fois pour la trace
 *   7. Le payload JSON contient tous les champs de premier niveau attendus
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Hoisted mocks (must be declared before any imports) ─────────────────────

const {
  MockUnauthenticatedError,
  MockForbiddenError,
  mockRequireApiUser,
  mockWithUser,
  mockTransaction,
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
  const mockTransaction = vi.fn();
  const mockWithUser = vi.fn(() => ({ $transaction: mockTransaction }));
  const mockRequireApiUser = vi.fn();
  return {
    MockUnauthenticatedError,
    MockForbiddenError,
    mockRequireApiUser,
    mockWithUser,
    mockTransaction,
  };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@eduquiz/db', () => ({
  AuditEventKind: { DATA_EXPORT_DELIVERED: 'DATA_EXPORT_DELIVERED' },
  DataRequestKind: { EXPORT: 'EXPORT' },
  DataRequestStatus: { COMPLETED: 'COMPLETED' },
  withUser: mockWithUser,
  // Intentionnellement sans `prisma` — toute utilisation directe lèverait
  // un TypeError au runtime, ce qui ferait échouer les autres tests.
}));

vi.mock('../../../../lib/auth/server', () => ({
  requireApiUser: mockRequireApiUser,
  UnauthenticatedError: MockUnauthenticatedError,
  ForbiddenError: MockForbiddenError,
}));

vi.mock('pdf-lib', () => {
  const mockFont = { widthOfTextAtSize: vi.fn().mockReturnValue(50) };
  const mockPage = { drawText: vi.fn(), drawLine: vi.fn() };
  const mockPdfDoc = {
    embedFont: vi.fn().mockResolvedValue(mockFont),
    addPage: vi.fn().mockReturnValue(mockPage),
    save: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])), // %PDF
  };
  return {
    PDFDocument: { create: vi.fn().mockResolvedValue(mockPdfDoc) },
    StandardFonts: { Helvetica: 'Helvetica', HelveticaBold: 'HelveticaBold' },
    rgb: vi.fn().mockReturnValue({}),
  };
});

// ─── Import SUT après les mocks ───────────────────────────────────────────────

import { GET } from './route';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const MOCK_PROFILE = {
  firstName: 'Alice',
  lastName: 'Tremblay',
  displayName: null,
  currentGrade: null,
  schoolCycle: null,
  avatarUrl: null,
  preferredLocale: 'fr',
  province: 'QC',
  birthDate: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const MOCK_ACCOUNT = {
  id: USER_ID,
  email: 'alice@example.com',
  role: 'LEARNER_ADULT',
  locale: 'FR',
  emailVerifiedAt: new Date('2025-01-01'),
  disabledAt: null,
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// Valeur retournée par la transaction de lecture.
const MOCK_READS = [MOCK_PROFILE, MOCK_ACCOUNT, [], [], []] as const;

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/account/export');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

/** Configure les deux transactions pour le chemin nominal. */
function setupHappyPath(): void {
  mockTransaction.mockResolvedValueOnce(MOCK_READS); // lecture
  mockTransaction.mockResolvedValueOnce(undefined); // trace (best-effort)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue({ id: USER_ID, role: 'LEARNER_ADULT' });
  });

  it('renvoie 401 si requireApiUser lève UnauthenticatedError', async () => {
    mockRequireApiUser.mockRejectedValue(new MockUnauthenticatedError());

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unauthenticated');
  });

  it('renvoie un export JSON avec les en-têtes corrects', async () => {
    setupHappyPath();

    const res = await GET(makeRequest({ format: 'json', locale: 'fr' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/application\/json/);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/\.json/);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('renvoie un export PDF avec Content-Type application/pdf', async () => {
    setupHappyPath();

    const res = await GET(makeRequest({ format: 'pdf', locale: 'fr' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/\.pdf/);
  });

  it("l'échec de la trace (best-effort) ne bloque pas l'export", async () => {
    mockTransaction.mockResolvedValueOnce(MOCK_READS); // lecture OK
    mockTransaction.mockRejectedValueOnce(new Error('DB down')); // trace KO

    const res = await GET(makeRequest({ format: 'json' }));

    expect(res.status).toBe(200);
  });

  it('appelle withUser avec le contexte RLS correct pour les lectures', async () => {
    setupHappyPath();

    await GET(makeRequest());

    // Premier appel : lecture
    expect(mockWithUser).toHaveBeenCalledWith({ userId: USER_ID, role: 'LEARNER_ADULT' });
  });

  it('appelle withUser une seconde fois avec le même contexte pour la trace', async () => {
    setupHappyPath();

    await GET(makeRequest());

    expect(mockWithUser).toHaveBeenCalledTimes(2);
    expect(mockTransaction).toHaveBeenCalledTimes(2);
    // Les deux appels utilisent le même contexte.
    const calls = mockWithUser.mock.calls;
    expect(calls[0]).toEqual(calls[1]);
  });

  it('le payload JSON contient tous les champs de premier niveau attendus', async () => {
    setupHappyPath();

    const res = await GET(makeRequest({ format: 'json', locale: 'fr' }));
    const body = JSON.parse(await res.text()) as Record<string, unknown>;

    expect(body).toHaveProperty('exportedAt');
    expect(body).toHaveProperty('schemaVersion', '1');
    expect(body).toHaveProperty('account');
    expect(body).toHaveProperty('profile');
    expect(body).toHaveProperty('consents');
    expect(body).toHaveProperty('auditLog');
    expect(body).toHaveProperty('dataRequests');
  });
});
