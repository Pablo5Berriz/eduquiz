import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckRateLimit, mockRequireApiUser, mockWarn } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockRequireApiUser: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@eduquiz/auth/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@eduquiz/db', () => {
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn() },
    profile: { update: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    AuditEventKind: {},
    DataRequestKind: { DELETION: 'DELETION' },
    DataRequestStatus: { AWAITING_GRACE_PERIOD: 'AWAITING_GRACE_PERIOD' },
    GradeCode: {},
    Locale: { FR: 'FR', EN: 'EN' },
    UserRole: { ADMIN: 'ADMIN', LEARNER_ADULT: 'LEARNER_ADULT' },
    prisma,
    prismaService: prisma,
  };
});

vi.mock('../../../auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('../server', () => ({
  requireApiUser: mockRequireApiUser,
}));

vi.mock('../rate-limit-server', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('../../logger', () => ({
  logger: { warn: mockWarn },
}));

import { requestAccountDeletion } from './account';

describe('requestAccountDeletion rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      role: 'LEARNER_ADULT',
    });
    mockCheckRateLimit.mockResolvedValue({ allowed: false, bypassed: false, keyHash: 'abc123def456' });
  });

  it('bloque et loggue uniquement keyHash, jamais userId brut', async () => {
    const result = await requestAccountDeletion({
      password: 'Password123',
      confirmText: 'SUPPRIMER',
      expectedWord: 'SUPPRIMER',
    });

    expect(result).toEqual({ ok: false, fieldErrors: { form: 'rateLimited' } });
    expect(mockWarn).toHaveBeenCalledWith('account.deletion.rate_limited', { keyHash: 'abc123def456' });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('550e8400-e29b-41d4-a716-446655440000');
  });
});
