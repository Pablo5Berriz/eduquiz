/**
 * Hashing et vérification des mots de passe avec Argon2id.
 *
 * Utilise @node-rs/argon2 — bindings Rust avec prebuilts Windows/Linux/macOS
 * pour Node 18-22, aucune compilation native requise.
 *
 * Paramètres : OWASP Password Storage Cheat Sheet (édition 2024)
 *   m = 19 456 KiB (19 MiB)
 *   t = 2  itérations
 *   p = 1  parallélisme
 */

import { hash, verify } from '@node-rs/argon2';

const ARGON2_OPTIONS = {
  algorithm: 2,          // 2 = Argon2id (valeur numérique directe, évite le const enum)
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error('hashPassword: mot de passe vide');
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  storedHash: string | null | undefined,
  plain: string,
): Promise<boolean> {
  if (!storedHash || !plain) return false;
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}

/**
 * @node-rs/argon2 n'expose pas needsRehash — on détecte manuellement
 * si le hash a été produit avec des paramètres différents des nôtres.
 * Le format argon2 encode : $argon2id$v=19$m=19456,t=2,p=1$...
 */
export function needsRehash(storedHash: string): boolean {
  try {
    return !storedHash.includes('m=19456,t=2,p=1');
  } catch {
    return true;
  }
}