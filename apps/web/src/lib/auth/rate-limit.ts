/**
 * Helpers de rate limiting spécialisés pour les Server Actions auth/account.
 *
 * Centralise les quotas par défaut documentés ici. Les helpers qui
 * dépendent de `next/headers` vivent dans `rate-limit-server.ts`, protégé
 * par `server-only`, afin d'éviter tout import accidentel côté client.
 *
 * **Fail-open** : si Redis n'est pas configuré (dev local) ou
 * indisponible, `allowed = true`. Cf. `@eduquiz/rate-limit` pour le
 * détail du trade-off.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

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
  /** Création invitation parent : 10 par heure par parent. */
  createParentInvitation: { limit: 10, windowMs: 1 * HOUR },
  /** Saisie code de rattachement : 5 tentatives par 15 min par mineur. */
  redeemParentCode: { limit: 5, windowMs: 15 * MIN },
} as const;

export interface CheckRateLimitInput {
  readonly bucket: keyof typeof RateLimits;
  readonly key: string;
}
