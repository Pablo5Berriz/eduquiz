/**
 * Tests unit du paquet rate-limit.
 *
 * Le client Redis est mocké via `_setRedisForTests`. On valide :
 *   - mode no-op (Redis non configuré)
 *   - allowed → blocked au-delà de `limit`
 *   - fail-open en cas d'erreur ioredis
 *   - extraction IP depuis x-forwarded-for / x-real-ip
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { _resetRedisForTests, _setRedisForTests } from './client.js';
import { _resetRateLimitEnvCacheForTests } from './env.js';
import { clientIpFrom, withRateLimit } from './limit.js';

type TestRedisClient = Parameters<typeof _setRedisForTests>[0];

afterEach(() => {
  _resetRedisForTests();
  _resetRateLimitEnvCacheForTests();
});

describe('withRateLimit (mode no-op)', () => {
  it('autorise toujours quand Redis est absent', async () => {
    // Aucun Redis configuré + aucun client mock posé → no-op.
    const result = await withRateLimit({
      bucket: 'test',
      key: 'k',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});

describe('withRateLimit (avec Redis mock)', () => {
  function makePipelineMock(counter: { value: number }) {
    return {
      multi() {
        const cmds: { name: string }[] = [];
        return {
          incr() {
            cmds.push({ name: 'incr' });
            return this;
          },
          pexpire() {
            cmds.push({ name: 'pexpire' });
            return this;
          },
          pttl() {
            cmds.push({ name: 'pttl' });
            return this;
          },
          exec() {
            counter.value += 1;
            return Promise.resolve([
              [null, counter.value],
              [null, 1],
              [null, 30_000],
            ]);
          },
        };
      },
      on() {
        // no-op
      },
    };
  }

  it('compte les hits et bloque au-delà du seuil', async () => {
    const counter = { value: 0 };
    _setRedisForTests(makePipelineMock(counter) as unknown as TestRedisClient);

    const r1 = await withRateLimit({ bucket: 'b', key: 'k', limit: 2, windowMs: 60_000 });
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r1.bypassed).toBe(false);

    const r2 = await withRateLimit({ bucket: 'b', key: 'k', limit: 2, windowMs: 60_000 });
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = await withRateLimit({ bucket: 'b', key: 'k', limit: 2, windowMs: 60_000 });
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('fail-open quand pipeline.exec lève', async () => {
    _setRedisForTests({
      multi() {
        return {
          incr() {
            return this;
          },
          pexpire() {
            return this;
          },
          pttl() {
            return this;
          },
          exec: vi.fn().mockRejectedValue(new Error('redis down')),
        };
      },
      on() {
        /* */
      },
    } as unknown as TestRedisClient);

    const result = await withRateLimit({ bucket: 'b', key: 'k', limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.bypassed).toBe(true);
  });

  it('fail-open quand pipeline.exec retourne null', async () => {
    _setRedisForTests({
      multi() {
        return {
          incr() { return this; },
          pexpire() { return this; },
          pttl() { return this; },
          exec: vi.fn().mockResolvedValue(null),
        };
      },
      on() {},
    } as unknown as TestRedisClient);

    const result = await withRateLimit({ bucket: 'b', key: 'k', limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('refuse les paramètres aberrants en fail-open', async () => {
    const result = await withRateLimit({ bucket: 'b', key: 'k', limit: 0, windowMs: 0 });
    expect(result.allowed).toBe(true);
    expect(result.bypassed).toBe(true);
  });
});

describe('clientIpFrom', () => {
  it('extrait le premier maillon de x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' });
    expect(clientIpFrom(h)).toBe('203.0.113.5');
  });

  it('utilise x-real-ip si XFF absent', () => {
    const h = new Headers({ 'x-real-ip': '198.51.100.7' });
    expect(clientIpFrom(h)).toBe('198.51.100.7');
  });

  it('retombe sur 127.0.0.1 sans rien', () => {
    const h = new Headers();
    expect(clientIpFrom(h)).toBe('127.0.0.1');
  });
});
