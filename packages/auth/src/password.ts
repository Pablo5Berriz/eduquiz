/**
 * Hashing et vérification des mots de passe avec Argon2id.
 *
 * Choix verrouillé en Phase 0 (cf. commentaire du champ
 * `User.passwordHash` dans le schéma Prisma). Argon2id est l'algorithme
 * recommandé par OWASP, l'IETF (RFC 9106) et le NIST pour le stockage
 * de mots de passe en 2026.
 *
 * Paramètres : OWASP Password Storage Cheat Sheet (édition 2024)
 *   m = 19 456 KiB (19 MiB)
 *   t = 2  itérations
 *   p = 1  parallélisme
 *
 * Ces valeurs offrent un bon compromis sécurité/performance sur un
 * serveur Node.js moyenne gamme (~50-80 ms par hash). Si tu changes
 * un paramètre ici, garde le hash existant : le format `argon2` encode
 * les paramètres dans la sortie, donc `verify()` reste compatible avec
 * les anciens hashes.
 */

import argon2 from 'argon2';

/**
 * Paramètres OWASP 2024 — voir
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Hashe un mot de passe en clair. Retourne une chaîne au format
 * `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>` qui peut être stockée
 * directement dans `User.passwordHash`.
 *
 * Lève si le mot de passe est vide (filet de sécurité contre une
 * mauvaise validation amont — la vraie validation Zod doit avoir lieu
 * côté route, pas ici).
 */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain) {
    throw new Error('hashPassword: mot de passe vide');
  }
  return argon2.hash(plain, ARGON2_OPTIONS);
}

/**
 * Vérifie un mot de passe en clair contre un hash stocké. Retourne
 * `true` en cas de match. **Ne jamais** comparer manuellement les
 * chaînes — Argon2 inclut une comparaison à temps constant.
 *
 * Si `hash` est vide ou `null` (compte sans mot de passe — créé par
 * OAuth), retourne `false` plutôt que de lever, pour ne pas révéler
 * l'absence de mot de passe via une erreur différente.
 */
export async function verifyPassword(
  hash: string | null | undefined,
  plain: string,
): Promise<boolean> {
  if (!hash || !plain) return false;
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // Hash mal formé, paramètre incompatible, etc. — on traite comme
    // une vérification ratée plutôt que comme une erreur 500.
    return false;
  }
}

/**
 * Indique si un hash a été produit avec des paramètres plus faibles
 * que ceux que l'on utilise actuellement, et donc s'il faut re-hasher
 * le mot de passe au prochain login.
 *
 * Argon2 expose cette logique nativement via `needsRehash`.
 */
export function needsRehash(hash: string): boolean {
  try {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  } catch {
    return true;
  }
}
