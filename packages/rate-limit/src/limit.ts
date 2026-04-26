/**
 * Rate limiting fenêtre fixe (`fixed window`) basé sur deux commandes
 * Redis atomiques :
 *
 *   MULTI
 *     INCR  rl:<bucket>:<key>
 *     PEXPIRE rl:<bucket>:<key> <windowMs> NX
 *   EXEC
 *
 * Le `PEXPIRE NX` ne pose le TTL que si la clé n'en a pas — garantit
 * que la fenêtre démarre au premier hit et n'est pas réinitialisée par
 * les hits suivants. Cohérent et atomique sans Lua.
 *
 * **Fail-open** : si Redis est indisponible (pas configuré, ou erreur
 * réseau), `withRateLimit` retourne `{ allowed: true, ... }` plutôt
 * que de bloquer l'utilisateur. Trade-off délibéré pour la V1 d'une
 * app éducative B2C — un attaquant peut profiter d'une fenêtre courte
 * de panne Redis, mais ça reste préférable à un déni de service auto-
 * infligé. À reconsidérer pour des actions très sensibles plus tard.
 */

import { getRedis } from './client.js';

export interface RateLimitInput {
  /**
   * Catégorie d'action (ex. `signin`, `register`, `forgot-password`).
   * Utilisée comme préfixe de bucket pour ne pas mélanger les compteurs
   * de différentes actions partageant la même clé.
   */
  readonly bucket: string;
  /**
   * Discriminant (IP, email, userId, IP+email…). Tronqué à 200 caractères
   * pour éviter les abus.
   */
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  /** Date d'expiration de la fenêtre courante (epoch ms), ou `null` si fail-open. */
  readonly resetAt: number | null;
  /** Vrai si Redis est indisponible — la requête a été laissée passer. */
  readonly bypassed: boolean;
}

const FAIL_OPEN: Omit<RateLimitResult, 'remaining'> = {
  allowed: true,
  resetAt: null,
  bypassed: true,
};

export async function withRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (input.limit <= 0 || input.windowMs <= 0) {
    return { ...FAIL_OPEN, remaining: input.limit };
  }

  const redis = getRedis();
  if (!redis) {
    return { ...FAIL_OPEN, remaining: input.limit };
  }

  const safeKey = input.key.slice(0, 200);
  const redisKey = `rl:${input.bucket}:${safeKey}`;

  try {
    const pipeline = redis.multi();
    pipeline.incr(redisKey);
    // PEXPIRE … NX (set seulement si pas déjà en place) — disponible
    // depuis Redis 7. Pour compat 6.x, on accepte le risque rare d'un
    // double-set au tout premier hit (idempotent puisque la valeur
    // serait identique).
    pipeline.pexpire(redisKey, input.windowMs, 'NX');
    pipeline.pttl(redisKey);
    const results = await pipeline.exec();
    if (!results) return { ...FAIL_OPEN, remaining: input.limit };

    const [, count] = results[0] ?? [null, 0];
    const [, ttl] = results[2] ?? [null, -1];
    const counter = typeof count === 'number' ? count : Number(count) || 0;
    const ttlMs = typeof ttl === 'number' ? ttl : Number(ttl) || 0;

    const allowed = counter <= input.limit;
    const remaining = Math.max(0, input.limit - counter);
    const resetAt = ttlMs > 0 ? Date.now() + ttlMs : null;

    return { allowed, remaining, resetAt, bypassed: false };
  } catch {
    // Erreur réseau Redis — fail-open.
    return { ...FAIL_OPEN, remaining: input.limit };
  }
}

/**
 * Helper pratique pour les Server Actions : extrait l'IP depuis le
 * header `x-forwarded-for` (premier maillon) avec fallback `127.0.0.1`.
 * Tronque à la première virgule pour ignorer les proxies aval.
 */
export function clientIpFrom(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return '127.0.0.1';
}
