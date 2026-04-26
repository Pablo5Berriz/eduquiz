/**
 * Helpers de rate limiting spécialisés pour les Server Actions auth/account.
 *
 * Centralise la lecture de l'IP cliente depuis `headers()` Next.js et
 * applique des quotas par défaut documentés ici. Tous les helpers
 * retournent `{ allowed }` simplifié — les Server Actions appelantes
 * traduisent `false` en `{ ok: false, fieldErrors: { form: 'rateLimited' } }`.
 *
 * **Fail-open** : si Redis n'est pas configuré (dev local) ou
 * indisponible, `allowed = true`. Cf. `@eduquiz/rate-limit` pour le
 * détail du trade-off.
 */

import { clientIpFrom, withRateLimit } from '@eduquiz/rate-limit';
import { headers } from 'next/headers';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Récupère l'IP cliente depuis les headers de la requête courante. */
export function currentClientIp(): string {
  return clientIpFrom(headers());
}

export const RateLimits = {
  /** Connexion : 5 tentatives par minute par IP. */
  signin: { limit: 5, windowMs: 1 * MIN },
  /** Inscription : 3 tentatives par 15 minutes par IP. */
  register: { limit: 3, windowMs: 15 * MIN },
  /** Mot de passe oublié : 3 tentatives par 15 minutes par IP. */
  forgotPassword: { limit: 3, windowMs: 15 * MIN },
  /** Renvoi email : 3 tentatives par 15 minutes par email. */
  resendVerification: { limit: 3, windowMs: 15 * MIN },
  /** Suppression de compte : 3 tentatives par jour par utilisateur. */
  accountDeletion: { limit: 3, windowMs: 1 * DAY },
} as const;

export interface CheckRateLimitInput {
  readonly bucket: keyof typeof RateLimits;
  readonly key: string;
}

export async function checkRateLimit(input: CheckRateLimitInput): Promise<{ allowed: boolean }> {
  const config = RateLimits[input.bucket];
  const result = await withRateLimit({
    bucket: input.bucket,
    key: input.key,
    limit: config.limit,
    windowMs: config.windowMs,
  });
  return { allowed: result.allowed };
}
