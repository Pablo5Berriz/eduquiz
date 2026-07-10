/**
 * Point d'entrée du paquet @eduquiz/rate-limit.
 *
 *   - `withRateLimit({bucket, key, limit, windowMs})` : applique un
 *     bucket fixe Redis et retourne `{ allowed, remaining, resetAt,
 *     bypassed }`.
 *   - `clientIpFrom(headers)` : extrait l'IP cliente depuis les
 *     en-têtes `x-forwarded-for` / `x-real-ip` (premier maillon).
 *   - `getRateLimitEnv()` : valide les env vars (REDIS_URL optionnel).
 *
 * Mode no-op si `REDIS_URL` est absent — pratique en dev local sans
 * Redis monté ou en CI sans service Redis dédié.
 */

export { withRateLimit, clientIpFrom, type RateLimitInput, type RateLimitResult } from './limit.js';

export { getRateLimitEnv, type RateLimitEnv } from './env.js';
