/**
 * Validation env du paquet rate-limit.
 *
 * `REDIS_URL` est optionnel : si absent, le wrapper bascule en mode
 * « no-op » (toutes les vérifications passent). Pratique pour le dev
 * local sans Redis monté et pour les tests unit.
 */

import { z } from 'zod';

const schema = z.object({
  REDIS_URL: z.string().url().optional(),
});

export type RateLimitEnv = z.infer<typeof schema>;

let cached: RateLimitEnv | undefined;

export function getRateLimitEnv(source: NodeJS.ProcessEnv = process.env): RateLimitEnv {
  if (cached) return cached;
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new Error(`Configuration rate-limit invalide :\n${issues}`);
  }
  cached = result.data;
  return cached;
}

/** Réinitialise le cache (tests). @internal */
export function _resetRateLimitEnvCacheForTests(): void {
  cached = undefined;
}
