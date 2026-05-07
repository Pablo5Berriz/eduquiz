import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockHeaders, mockWarn, mockWithRateLimit } = vi.hoisted(() => ({
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

vi.mock('../logger', () => ({
  logger: {
    warn: mockWarn,
  },
}));

import { checkRateLimit, currentClientIp, hashRateLimitKey } from './rate-limit-server';

describe('rate-limit-server', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.REDIS_URL;
    mockHeaders.mockReturnValue(new Headers({ 'x-forwarded-for': '203.0.113.10', 'x-request-id': 'req-1' }));
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });

  it('hash les clés sensibles au format sha256 hex court', () => {
    expect(hashRateLimitKey('203.0.113.10:test@example.com')).toMatch(/^[a-f0-9]{12}$/);
  });

  it("récupère l'IP courante via headers() côté serveur", () => {
    expect(currentClientIp()).toBe('203.0.113.10');
  });

  it('retourne keyHash et ne loggue pas la clé brute lors du bypass', async () => {
    mockWithRateLimit.mockResolvedValue({ allowed: true, remaining: 5, resetAt: null, bypassed: true });
    const rawKey = '203.0.113.10:test@example.com';

    const result = await checkRateLimit({ bucket: 'signin', key: rawKey });

    expect(result).toEqual({ allowed: true, bypassed: true, keyHash: hashRateLimitKey(rawKey) });
    expect(mockWarn).toHaveBeenCalledWith('rate_limit.bypassed', {
      bucket: 'signin',
      keyHash: hashRateLimitKey(rawKey),
      reqId: 'req-1',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(rawKey);
  });

  it('fail-closed sur un bucket critique si REDIS_URL est défini et Redis bypass', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    mockWithRateLimit.mockResolvedValue({ allowed: true, remaining: 5, resetAt: null, bypassed: true });
    const rawKey = '203.0.113.10:test@example.com';

    const result = await checkRateLimit({ bucket: 'signin', key: rawKey });

    expect(result).toEqual({ allowed: false, bypassed: true, keyHash: hashRateLimitKey(rawKey) });
    expect(mockWarn).toHaveBeenCalledWith('rate_limit.redis_bypass_unexpected', {
      bucket: 'signin',
      keyHash: hashRateLimitKey(rawKey),
      reqId: 'req-1',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(rawKey);
  });

  it('reste fail-open surveillé sur un bucket non critique si Redis bypass', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    mockWithRateLimit.mockResolvedValue({ allowed: true, remaining: 3, resetAt: null, bypassed: true });
    const rawKey = 'test@example.com';

    const result = await checkRateLimit({ bucket: 'resendVerification', key: rawKey });

    expect(result).toEqual({ allowed: true, bypassed: true, keyHash: hashRateLimitKey(rawKey) });
    expect(mockWarn).toHaveBeenCalledWith('rate_limit.bypassed', {
      bucket: 'resendVerification',
      keyHash: hashRateLimitKey(rawKey),
      reqId: 'req-1',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(rawKey);
  });
});
