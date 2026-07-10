import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckRateLimit, mockFindUnique, mockWarn } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockFindUnique: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@eduquiz/auth/password', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@eduquiz/auth/tokens', () => ({
  consumeToken: vi.fn(),
  createToken: vi.fn(),
}));

vi.mock('@eduquiz/db', () => {
  const prisma = {
    user: { findUnique: mockFindUnique, update: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    AuditEventKind: { AUTH_PASSWORD_RESET: 'AUTH_PASSWORD_RESET' },
    prisma,
    prismaService: prisma,
  };
});

vi.mock('@eduquiz/email', () => ({
  buildResetPasswordEmail: vi.fn(),
  sendEmail: vi.fn(),
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

import { requestPasswordReset } from './forgot-password';

describe('requestPasswordReset rate limiting and anti-enumeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne ok:true quand le rate limit bloque et ne loggue que keyHash', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      bypassed: false,
      keyHash: 'abc123def456',
    });

    const result = await requestPasswordReset({ locale: 'fr', email: 'user@example.com' });

    expect(result).toEqual({ ok: true });
    expect(mockWarn).toHaveBeenCalledWith('auth.forgot_password.rate_limited', {
      keyHash: 'abc123def456',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('203.0.113.10');
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('user@example.com');
  });

  it('retourne ok:true et loggue un warning si une erreur interne survient', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      bypassed: true,
      keyHash: 'abc123def456',
    });
    mockFindUnique.mockRejectedValue(new Error('database unavailable'));

    const result = await requestPasswordReset({ locale: 'fr', email: 'user@example.com' });

    expect(result).toEqual({ ok: true });
    expect(mockWarn).toHaveBeenCalledWith('auth.forgot_password.internal_bypassed', {
      keyHash: 'abc123def456',
    });
  });
});
