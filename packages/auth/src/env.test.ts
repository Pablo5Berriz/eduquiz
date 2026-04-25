/**
 * Smoke tests pour la validation env. Pas de mock Prisma ni argon2 :
 * on vérifie uniquement que le schéma Zod accepte/rejette correctement
 * les inputs.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { _resetAuthEnvCacheForTests, getAuthEnv, isProviderConfigured } from './env.js';

describe('getAuthEnv', () => {
  afterEach(() => {
    _resetAuthEnvCacheForTests();
  });

  it('accepte un environnement minimal valide', () => {
    const env = getAuthEnv({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
    } as NodeJS.ProcessEnv);

    expect(env.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.AUTH_URL).toBe('http://localhost:3000');
    // AUTH_TRUST_HOST par défaut = true.
    expect(env.AUTH_TRUST_HOST).toBe(true);
    expect(env.AUTH_DEBUG).toBe(false);
    expect(env.AUTH_GOOGLE_ID).toBe('');
  });

  it('refuse un AUTH_SECRET trop court', () => {
    expect(() =>
      getAuthEnv({
        AUTH_SECRET: 'short',
        AUTH_URL: 'http://localhost:3000',
      } as NodeJS.ProcessEnv),
    ).toThrow(/AUTH_SECRET/);
  });

  it('refuse une AUTH_URL non absolue', () => {
    expect(() =>
      getAuthEnv({
        AUTH_SECRET: 'a'.repeat(32),
        AUTH_URL: 'not-a-url',
      } as NodeJS.ProcessEnv),
    ).toThrow(/AUTH_URL/);
  });

  it('parse AUTH_TRUST_HOST avec différentes formes truthy/falsy', () => {
    const env = getAuthEnv({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_TRUST_HOST: 'false',
    } as NodeJS.ProcessEnv);
    expect(env.AUTH_TRUST_HOST).toBe(false);
  });
});

describe('isProviderConfigured', () => {
  it('détecte Google configuré quand id ET secret sont posés', () => {
    _resetAuthEnvCacheForTests();
    const env = getAuthEnv({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_GOOGLE_ID: 'client-id',
      AUTH_GOOGLE_SECRET: 'client-secret',
    } as NodeJS.ProcessEnv);
    expect(isProviderConfigured(env, 'google')).toBe(true);
    expect(isProviderConfigured(env, 'apple')).toBe(false);
  });

  it('refuse si une seule des deux variables est posée', () => {
    _resetAuthEnvCacheForTests();
    const env = getAuthEnv({
      AUTH_SECRET: 'a'.repeat(32),
      AUTH_URL: 'http://localhost:3000',
      AUTH_GOOGLE_ID: 'client-id',
    } as NodeJS.ProcessEnv);
    expect(isProviderConfigured(env, 'google')).toBe(false);
  });
});
