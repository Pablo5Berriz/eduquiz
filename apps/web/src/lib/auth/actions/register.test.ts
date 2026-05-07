import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckRateLimit, mockWarn } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@eduquiz/auth/password', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@eduquiz/auth/tokens', () => ({
  createToken: vi.fn(),
}));

vi.mock('@eduquiz/email', () => ({
  buildVerificationEmail: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('@eduquiz/db', () => ({
  AuditEventKind: { AUTH_USER_CREATED: 'AUTH_USER_CREATED' },
  ConsentEventKind: {
    TERMS_ACCEPTED: 'TERMS_ACCEPTED',
    PRIVACY_ACCEPTED: 'PRIVACY_ACCEPTED',
    MARKETING_OPTED_IN: 'MARKETING_OPTED_IN',
  },
  Locale: { EN: 'EN', FR: 'FR' },
  UserRole: { LEARNER_ADULT: 'LEARNER_ADULT' },
  prisma: {
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  prismaService: {
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../rate-limit-server', () => ({
  checkRateLimit: mockCheckRateLimit,
  currentClientIp: vi.fn(() => '203.0.113.10'),
}));

vi.mock('../../logger', () => ({
  logger: { warn: mockWarn },
}));

vi.mock('../url', () => ({
  getCanonicalAuthUrl: vi.fn((path: string) => `https://example.test${path}`),
}));

import { registerAdult } from './register';

describe('register rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: false, bypassed: false, keyHash: 'abc123def456' });
  });

  it("bloque l'inscription adulte et loggue uniquement keyHash", async () => {
    const result = await registerAdult({
      locale: 'fr',
      email: 'adult@example.com',
      password: 'Password123',
      birthDate: '1990-01-01',
      acceptTerms: true,
      acceptMarketing: false,
    });

    expect(result).toEqual({ ok: false, fieldErrors: { form: 'rateLimited' } });
    expect(mockWarn).toHaveBeenCalledWith('auth.register.rate_limited', { keyHash: 'abc123def456' });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('203.0.113.10');
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('adult@example.com');
  });
});
