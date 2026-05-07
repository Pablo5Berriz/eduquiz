import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockFindUnique, mockHeaders, mockWarn, mockWithRateLimit } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockHeaders: vi.fn(),
  mockWarn: vi.fn(),
  mockWithRateLimit: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('@eduquiz/rate-limit', () => ({
  clientIpFrom: vi.fn((headers: Headers) => headers.get('x-forwarded-for') ?? '127.0.0.1'),
  withRateLimit: mockWithRateLimit,
}));

vi.mock('@eduquiz/auth/tokens', () => ({
  consumeToken: vi.fn(),
  createToken: vi.fn(),
}));

vi.mock('@eduquiz/db', () => {
  const prisma = {
    auditLog: { create: vi.fn() },
    user: { findUnique: mockFindUnique, update: vi.fn() },
  };
  return {
    AuditEventKind: { AUTH_VERIFY_EMAIL: 'AUTH_VERIFY_EMAIL' },
    prisma,
    prismaService: prisma,
  };
});

vi.mock('@eduquiz/email', () => ({
  buildVerificationEmail: vi.fn(),
  buildWelcomeEmail: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('../../logger', () => ({
  logger: { warn: mockWarn },
}));

vi.mock('../url', () => ({
  getCanonicalAuthUrl: vi.fn((path: string) => `https://example.test${path}`),
}));

import { resendVerification } from './verify-email';

describe('resendVerification rate limiting', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    mockHeaders.mockReturnValue(new Headers({ 'x-request-id': 'req-verify' }));
  });

  it('reste anti-enumeration si Redis bypass est fail-open surveillé et ne loggue pas email brut', async () => {
    mockWithRateLimit.mockResolvedValue({ allowed: true, remaining: 3, resetAt: null, bypassed: true });
    mockFindUnique.mockResolvedValue(null);

    const result = await resendVerification({ email: 'User@Test.Example', locale: 'fr' });

    expect(result).toEqual({ ok: true });
    expect(mockWithRateLimit).toHaveBeenCalledWith({
      bucket: 'resendVerification',
      key: 'user@test.example',
      limit: 3,
      windowMs: 900_000,
    });
    expect(mockWarn).toHaveBeenCalledWith('rate_limit.bypassed', {
      bucket: 'resendVerification',
      keyHash: expect.stringMatching(/^[a-f0-9]{12}$/),
      reqId: 'req-verify',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('User@Test.Example');
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('user@test.example');
  });

  it('retourne ok:true si le rate-limit bloque et loggue uniquement keyHash', async () => {
    mockWithRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000, bypassed: false });

    const result = await resendVerification({ email: 'User@Test.Example', locale: 'fr' });

    expect(result).toEqual({ ok: true });
    expect(mockWarn).toHaveBeenCalledWith('auth.resend_verification.rate_limited', {
      keyHash: expect.stringMatching(/^[a-f0-9]{12}$/),
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('User@Test.Example');
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('user@test.example');
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });
});
