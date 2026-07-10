/**
 * Singleton ioredis lazy. Ne crée la connexion qu'au premier appel
 * pour ne pas bloquer le boot d'un process qui n'utilise pas Redis
 * (par ex. les builds Next.js statiques ou les tests qui n'importent
 * pas `withRateLimit`).
 */

import { Redis } from 'ioredis';

import { getRateLimitEnv } from './env.js';

let client: Redis | null = null;
let initialised = false;
let lastRedisErrorLogAt = 0;

const REDIS_ERROR_LOG_COOLDOWN_MS = 30_000;

function sanitizeLogValue(value: string): string {
  return value.replace(/rediss?:\/\/[^\s"'\\]+/gi, '[redacted]');
}

function serializeRedisError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { errorType: typeof error };
  }

  const withCode = error as Error & { code?: unknown };
  return {
    errorName: error.name,
    errorMessage: sanitizeLogValue(error.message),
    ...(typeof withCode.code === 'string' || typeof withCode.code === 'number'
      ? { errorCode: withCode.code }
      : {}),
  };
}

function logRedisError(error: unknown): void {
  const now = Date.now();
  if (now - lastRedisErrorLogAt < REDIS_ERROR_LOG_COOLDOWN_MS) return;
  lastRedisErrorLogAt = now;

  const record = {
    ts: new Date(now).toISOString(),
    level: 'warn',
    msg: 'rate_limit.redis.error',
    ...serializeRedisError(error),
  };
  process.stderr.write(`${JSON.stringify(record)}\n`);
}

export function getRedis(): Redis | null {
  if (initialised) return client;
  initialised = true;
  const env = getRateLimitEnv();
  if (!env.REDIS_URL) {
    client = null;
    return null;
  }
  client = new Redis(env.REDIS_URL, {
    // Pas de retry agressif au boot — si Redis est indisponible, on
    // laisse passer plutôt que de planter le process. Les commandes
    // individuelles auront leur propre comportement de fallback dans
    // `withRateLimit`.
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  // Évite que le crash d'un événement non géré tombe le process.
  client.on('error', (error) => {
    logRedisError(error);
  });
  return client;
}

/**
 * Permet aux tests de poser un client mock à la place du singleton.
 * @internal
 */
export function _setRedisForTests(c: Redis | null): void {
  client = c;
  initialised = true;
}

/** @internal */
export function _resetRedisForTests(): void {
  client = null;
  initialised = false;
  lastRedisErrorLogAt = 0;
}
