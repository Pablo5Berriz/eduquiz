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
  client.on('error', () => {
    // silencieux : la décision de fail-open est prise dans withRateLimit
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
}
