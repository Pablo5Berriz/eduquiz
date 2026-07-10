import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {},
}));

const { mockCheckRateLimit, mockSignIn, mockWarn } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockSignIn: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('../../../auth', () => ({
  signIn: mockSignIn,
}));

vi.mock('../rate-limit-server', () => ({
  checkRateLimit: mockCheckRateLimit,
  currentClientIp: vi.fn(() => '203.0.113.10'),
}));

vi.mock('../../logger', () => ({
  logger: { warn: mockWarn },
}));

import { signInAdult } from './signin';

describe('signInAdult rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloque sans appeler Auth.js et loggue uniquement le hash de clé', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      bypassed: false,
      keyHash: 'abc123def456',
    });

    const result = await signInAdult({
      locale: 'fr',
      email: 'User@Test.Example',
      password: 'Password123',
    });

    expect(result).toEqual({ ok: false, code: 'rateLimited' });
    expect(mockCheckRateLimit).toHaveBeenCalledWith({
      bucket: 'signin',
      key: '203.0.113.10:user@test.example',
    });
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledWith('auth.signin.rate_limited', { keyHash: 'abc123def456' });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('203.0.113.10');
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain('user@test.example');
  });
});
