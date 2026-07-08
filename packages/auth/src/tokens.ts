/**
 * Helpers de génération et de consommation de `VerificationToken`.
 *
 * Cas d'usage couverts :
 *   - Vérification d'adresse email après inscription (`purpose: "verify-email"`)
 *   - Réinitialisation de mot de passe (`purpose: "reset-password"`)
 *   - Magic link (préparé, mais le provider Email n'est pas activé en 1.3)
 *
 * La table `verification_tokens` (modèle Auth.js v5) ne stocke pas le
 * « purpose » explicitement. Pour différencier les cas d'usage sans
 * collision, on préfixe l'`identifier` avec le purpose et `:`. Exemple :
 *   identifier = "verify-email:user@example.com"
 *
 * Cette convention est interne au projet et invisible côté UI ;
 * `consumeToken()` la décode automatiquement.
 *
 * Sécurité :
 *   - Tokens 32 bytes random (256 bits) encodés base64url → 43 chars
 *   - Stockés en clair (acceptable car à usage unique + courte durée)
 *   - Consommation atomique en transaction (delete + récupération en
 *     une seule opération) pour empêcher la réutilisation
 */

import { randomBytes } from 'node:crypto';

import { prisma } from '@eduquiz/db';

export type TokenPurpose = 'verify-email' | 'reset-password' | 'magic-link' | 'confirm-parent-link';

/** Durées de vie par usage (en minutes). */
const TTL_MINUTES: Record<TokenPurpose, number> = {
  'verify-email': 60 * 24,       // 24 h
  'reset-password': 60,          // 1 h
  'magic-link': 15,              // 15 min
  'confirm-parent-link': 60 * 24, // 24 h — parent confirme le rattachement
};

export interface CreateTokenInput {
  readonly purpose: TokenPurpose;
  /** Email cible (les tokens sont émis pour un email, pas un userId). */
  readonly email: string;
}

export interface CreatedToken {
  readonly token: string;
  readonly expiresAt: Date;
}

/**
 * Crée un token unique pour un (purpose, email) donné. Si un token
 * actif existait déjà pour ce couple, il est invalidé (suppression).
 */
export async function createToken(input: CreateTokenInput): Promise<CreatedToken> {
  const identifier = `${input.purpose}:${input.email.toLowerCase()}`;
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MINUTES[input.purpose] * 60_000);

  // Invalide les éventuels tokens précédents pour ce couple (un seul
  // actif à la fois — évite que plusieurs liens dormants traînent dans
  // une boîte mail).
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  await prisma.verificationToken.create({
    data: { identifier, token, expires: expiresAt },
  });

  return { token, expiresAt };
}

export interface ConsumedToken {
  readonly purpose: TokenPurpose;
  readonly email: string;
}

/**
 * Consomme un token. Retourne le `purpose` et l'`email` associé si le
 * token est valide, `null` sinon (inconnu, expiré ou déjà consommé).
 *
 * Atomique : suppression + lecture dans une seule transaction. Un
 * appel concurrent avec le même token verra `null`.
 */
export async function consumeToken(token: string): Promise<ConsumedToken | null> {
  if (!token) return null;

  const deleted = await prisma.verificationToken
    .delete({
      where: { token },
    })
    .catch(() => null);

  if (!deleted) return null;
  if (deleted.expires.getTime() < Date.now()) return null;

  // Décompose `purpose:email`. Si l'identifier ne contient pas `:`, on
  // refuse — c'est un token issu d'un autre flux (sera utile si on
  // active un jour le provider Email d'Auth.js qui pose ses propres
  // identifiers sans préfixe).
  const sep = deleted.identifier.indexOf(':');
  if (sep <= 0) return null;
  const purpose = deleted.identifier.slice(0, sep);
  const email = deleted.identifier.slice(sep + 1);

  if (
    purpose !== 'verify-email' &&
    purpose !== 'reset-password' &&
    purpose !== 'magic-link' &&
    purpose !== 'confirm-parent-link'
  ) {
    return null;
  }

  return { purpose, email };
}

/**
 * Inspecte un token sans le consommer. Utile pour préremplir une page
 * de reset password avec l'email cible avant la soumission. **Ne pas
 * utiliser pour valider un usage** — toujours appeler `consumeToken`
 * dans la même requête que l'action protégée.
 */
export async function peekToken(token: string): Promise<ConsumedToken | null> {
  if (!token) return null;
  const found = await prisma.verificationToken.findUnique({ where: { token } });
  if (!found) return null;
  if (found.expires.getTime() < Date.now()) return null;
  const sep = found.identifier.indexOf(':');
  if (sep <= 0) return null;
  return {
    purpose: found.identifier.slice(0, sep) as TokenPurpose,
    email: found.identifier.slice(sep + 1),
  };
}
