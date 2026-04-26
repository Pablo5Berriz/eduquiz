/**
 * Tests unit du module `password.ts`.
 *
 * Aucun mock — Argon2 tourne en process. Les paramètres OWASP étant
 * volontairement coûteux (~50-80 ms par hash), on n'en fait que peu
 * d'itérations dans les tests.
 */

import { describe, expect, it } from 'vitest';

import { hashPassword, needsRehash, verifyPassword } from './password.js';

describe('hashPassword + verifyPassword', () => {
  it('hash et vérifie le même mot de passe', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
  });

  it('refuse un mot de passe différent', async () => {
    const hash = await hashPassword('original');
    expect(await verifyPassword(hash, 'différent')).toBe(false);
  });

  it('lève si on tente de hasher un vide (filet de sécurité)', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });

  it('verifyPassword retourne false sur hash null/vide sans lever', async () => {
    expect(await verifyPassword(null, 'whatever')).toBe(false);
    expect(await verifyPassword(undefined, 'whatever')).toBe(false);
    expect(await verifyPassword('', 'whatever')).toBe(false);
    expect(await verifyPassword('garbage', 'whatever')).toBe(false);
  });

  it('verifyPassword retourne false avec mot de passe vide', async () => {
    const hash = await hashPassword('something');
    expect(await verifyPassword(hash, '')).toBe(false);
  });
});

describe('needsRehash', () => {
  it('retourne false sur un hash fraîchement produit avec les mêmes paramètres', async () => {
    const hash = await hashPassword('password-1');
    expect(needsRehash(hash)).toBe(false);
  });

  it('retourne true sur un hash bidon', () => {
    expect(needsRehash('not-a-real-hash')).toBe(true);
  });
});
