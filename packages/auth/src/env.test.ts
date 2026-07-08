/**
 * Smoke tests pour la validation env. Pas de mock Prisma ni argon2 :
 * on vérifie uniquement que le schéma Zod accepte/rejette correctement
 * les inputs.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { _resetAuthEnvCacheForTests, getAuthEnv, isProviderConfigured } from './env.js';

function env(value: Record<string, string>): NodeJS.ProcessEnv {
  return value as unknown as NodeJS.ProcessEnv;
}

describe('getAuthEnv', () => {
  afterEach(() => {
    _resetAuthEnvCacheForTests();
  });

  it('accepte un environnement minimal valide', () => {
    const parsed = getAuthEnv(env({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
    }));

    expect(parsed.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(parsed.AUTH_URL).toBe('http://localhost:3000');
    // AUTH_TRUST_HOST par défaut = true.
    expect(parsed.AUTH_TRUST_HOST).toBe(true);
    expect(parsed.AUTH_DEBUG).toBe(false);
    expect(parsed.AUTH_GOOGLE_ID).toBe('');
  });

  it('refuse un AUTH_SECRET trop court', () => {
    expect(() =>
      getAuthEnv(env({
        AUTH_SECRET: 'short',
        AUTH_URL: 'http://localhost:3000',
      })),
    ).toThrow(/AUTH_SECRET/);
  });

  it('refuse une AUTH_URL non absolue', () => {
    expect(() =>
      getAuthEnv(env({
        AUTH_SECRET: 'a'.repeat(32),
        AUTH_URL: 'not-a-url',
      })),
    ).toThrow(/AUTH_URL/);
  });

  it('parse AUTH_TRUST_HOST avec différentes formes truthy/falsy', () => {
    const parsed = getAuthEnv(env({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_TRUST_HOST: 'false',
    }));
    expect(parsed.AUTH_TRUST_HOST).toBe(false);
  });
});

describe('isProviderConfigured', () => {
  it('détecte Google configuré quand id ET secret sont posés', () => {
    _resetAuthEnvCacheForTests();
    const parsed = getAuthEnv(env({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_GOOGLE_ID: 'client-id',
      AUTH_GOOGLE_SECRET: 'client-secret',
    }));
    expect(isProviderConfigured(parsed, 'google')).toBe(true);
    expect(isProviderConfigured(parsed, 'apple')).toBe(false);
  });

  it('refuse si une seule des deux variables est posée', () => {
    _resetAuthEnvCacheForTests();
    const parsed = getAuthEnv(env({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_GOOGLE_ID: 'client-id',
    }));
    expect(isProviderConfigured(parsed, 'google')).toBe(false);
  });
});
