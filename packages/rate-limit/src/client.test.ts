import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let capturedErrorHandler: ((error: unknown) => void) | undefined;

vi.mock('ioredis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    on(event: string, handler: (error: unknown) => void) {
      if (event === 'error') capturedErrorHandler = handler;
      return this;
    },
  })),
}));

describe('getRedis Redis error logging', () => {
  const originalRedisUrl = process.env.REDIS_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStderrWrite = process.stderr.write;
  let stderrWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'));
    process.env.REDIS_URL = 'redis://:super-secret-token@localhost:6379/0';
    process.env.NODE_ENV = 'production';
    capturedErrorHandler = undefined;
    stderrWrite = vi.fn(() => true);
    process.stderr.write = stderrWrite as unknown as typeof process.stderr.write;
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    process.stderr.write = originalStderrWrite;
    vi.useRealTimers();
  });

  it('écrit un warning JSON sans Redis URL ni stack, avec cooldown', async () => {
    const { getRedis } = await import('./client.js');
    getRedis();

    capturedErrorHandler?.(
      Object.assign(new Error('connect ECONNREFUSED redis://:super-secret-token@localhost:6379/0'), {
        code: 'ECONNREFUSED',
        stack: 'stack should not be logged',
      }),
    );
    capturedErrorHandler?.(new Error('second error'));

    expect(stderrWrite).toHaveBeenCalledTimes(1);
    const firstWrite = stderrWrite.mock.calls[0];
    expect(firstWrite).toBeDefined();
    const line = String(firstWrite![0]);
    const record = JSON.parse(line) as Record<string, unknown>;

    expect(record).toMatchObject({
      level: 'warn',
      msg: 'rate_limit.redis.error',
      errorName: 'Error',
      errorCode: 'ECONNREFUSED',
    });
    expect(line).not.toContain('super-secret-token');
    expect(line).not.toContain('redis://');
    expect(line).not.toContain('stack should not be logged');
  });

  it('réinitialise le cooldown dans _resetRedisForTests', async () => {
    const { _resetRedisForTests, getRedis } = await import('./client.js');
    getRedis();

    capturedErrorHandler?.(new Error('first error'));
    _resetRedisForTests();
    capturedErrorHandler?.(new Error('second error'));

    expect(stderrWrite).toHaveBeenCalledTimes(2);
  });
});
