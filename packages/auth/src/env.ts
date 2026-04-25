/**
 * Validation et parsing strict des variables d'environnement liées à
 * l'authentification.
 *
 * On vérifie au boot que les secrets obligatoires (`AUTH_SECRET`,
 * `AUTH_URL`) sont présents et non triviaux. Les secrets OAuth sont
 * tolérés vides : leur présence active simplement le provider
 * correspondant. Cette tolérance permet de démarrer le projet en local
 * sans devoir créer un projet Google Cloud / Apple Developer.
 *
 * En production, le déploiement doit échouer fort si la validation
 * échoue (cf. `apps/web/src/auth.ts` qui consomme ce module).
 */

import { z } from 'zod';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

/**
 * Schéma Zod du bloc `AUTH_*`. Tout est typé, défaut explicite, et
 * `transform` pour les booléens et les URL.
 */
const authEnvSchema = z.object({
  /** Secret de signature des cookies/JWT. Doit faire ≥ 32 caractères. */
  AUTH_SECRET: z
    .string({ required_error: 'AUTH_SECRET est requis' })
    .min(32, 'AUTH_SECRET doit faire au moins 32 caractères'),

  /**
   * URL canonique publique du service. En dev : `http://localhost:3000`,
   * en prod : `https://eduquiz.ca`. Auth.js l'utilise pour construire
   * les URL de callback.
   */
  AUTH_URL: z
    .string({ required_error: 'AUTH_URL est requis' })
    .url('AUTH_URL doit être une URL absolue'),

  /**
   * Nécessaire derrière un reverse proxy (Traefik, Nginx) qui termine
   * TLS pour qu'Auth.js fasse confiance aux en-têtes `X-Forwarded-*`.
   * Toujours `true` en dev derrière Docker.
   */
  AUTH_TRUST_HOST: z
    .string()
    .optional()
    .transform((v) => (v ? TRUE_VALUES.has(v.toLowerCase()) : true)),

  /** Active le provider Google si renseigné (clientId + clientSecret). */
  AUTH_GOOGLE_ID: z.string().optional().default(''),
  AUTH_GOOGLE_SECRET: z.string().optional().default(''),

  /** Active le provider Apple si renseigné (clientId + clientSecret). */
  AUTH_APPLE_ID: z.string().optional().default(''),
  AUTH_APPLE_SECRET: z.string().optional().default(''),

  /** Mode debug Auth.js (verbose). À garder désactivé en prod. */
  AUTH_DEBUG: z
    .string()
    .optional()
    .transform((v) => (v ? TRUE_VALUES.has(v.toLowerCase()) : false)),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

/**
 * Parse une fois et cache. Lève en cas d'env invalide — l'erreur Zod
 * est convertie en message multilignes lisible.
 */
let cached: AuthEnv | undefined;

export function getAuthEnv(source: NodeJS.ProcessEnv = process.env): AuthEnv {
  if (cached) return cached;
  const result = authEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new Error(`Configuration AUTH invalide :\n${issues}`);
  }
  cached = result.data;
  return cached;
}

/**
 * Indique si un provider OAuth est configuré (clientId ET clientSecret
 * non vides). Pratique pour conditionner l'inclusion du provider dans
 * la liste passée à NextAuth.
 */
export function isProviderConfigured(
  env: AuthEnv,
  provider: 'google' | 'apple',
): boolean {
  if (provider === 'google') {
    return env.AUTH_GOOGLE_ID.length > 0 && env.AUTH_GOOGLE_SECRET.length > 0;
  }
  return env.AUTH_APPLE_ID.length > 0 && env.AUTH_APPLE_SECRET.length > 0;
}

/**
 * Réinitialise le cache. Réservé aux tests.
 * @internal
 */
export function _resetAuthEnvCacheForTests(): void {
  cached = undefined;
}
