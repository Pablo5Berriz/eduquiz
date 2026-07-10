import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckRateLimit, mockRequireApiUser, mockWarn } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockRequireApiUser: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@eduquiz/auth/tokens', () => ({
  consumeToken: vi.fn(),
  createToken: vi.fn(),
}));

vi.mock('@eduquiz/db', () => ({
  AuditEventKind: { PARENT_LINK_CREATED: 'PARENT_LINK_CREATED' },
  ConsentEventKind: { PARENT_CONFIRMED: 'PARENT_CONFIRMED' },
  ParentLinkState: { PENDING: 'PENDING', VERIFIED: 'VERIFIED' },
  UserRole: { ADMIN: 'ADMIN', LEARNER_MINOR: 'LEARNER_MINOR', PARENT: 'PARENT' },
  prismaService: {
    parentChildLink: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@eduquiz/email', () => ({
  buildParentLinkConfirmEmail: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock('../auth/server', () => ({
  requireApiUser: mockRequireApiUser,
}));

vi.mock('../auth/rate-limit-server', () => ({
  checkRateLimit: mockCheckRateLimit,
  currentClientIp: vi.fn(() => '203.0.113.10'),
}));

vi.mock('../logger', () => ({
  logger: { warn: mockWarn },
}));

vi.mock('../auth/url', () => ({
  getCanonicalAuthUrl: vi.fn((path: string) => `https://example.test${path}`),
}));

vi.mock('../i18n/locale', () => ({
  resolveLocaleParam: vi.fn((locale: string) => (locale === 'en' ? 'en' : 'fr')),
}));

import { createParentInvitation, redeemParentCode } from './actions';

describe('family actions rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      bypassed: false,
      keyHash: 'abc123def456',
    });
  });

  it('bloque createParentInvitation et loggue uniquement keyHash', async () => {
    mockRequireApiUser.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PARENT',
    });

    const result = await createParentInvitation('child@example.com');

    expect(result).toEqual({ ok: false, error: 'rateLimited' });
    expect(mockWarn).toHaveBeenCalledWith('family.create_parent_invitation.rate_limited', {
      keyHash: 'abc123def456',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('bloque redeemParentCode et loggue uniquement keyHash', async () => {
    mockRequireApiUser.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'LEARNER_MINOR',
    });

    const result = await redeemParentCode('123456', 'fr');

    expect(result).toEqual({ ok: false, error: 'rateLimited' });
    expect(mockWarn).toHaveBeenCalledWith('family.redeem_parent_code.rate_limited', {
      keyHash: 'abc123def456',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
