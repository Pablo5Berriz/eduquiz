'use server';

/**
 * Server Action — connexion par email + mot de passe (écran 16).
 *
 * Particularité Auth.js v5 : `signIn('credentials', …)` lève une
 * `AuthError` (ou un sous-type comme `CredentialsSignin`) en cas
 * d'échec, ET appelle `redirect()` (qui lève aussi une erreur sentinelle
 * `NEXT_REDIRECT`) en cas de succès. Le pattern recommandé est donc :
 *
 *   try {
 *     await signIn(...);
 *   } catch (e) {
 *     if (e instanceof AuthError) return { ok: false, code: ... };
 *     throw e;            // laisse passer le NEXT_REDIRECT
 *   }
 *
 * Cf. https://authjs.dev/guides/pages/signin
 */

import { AuthError } from 'next-auth';

import { signIn } from '../../../auth';
import { logger } from '../../logger';
import { checkRateLimit, currentClientIp } from '../rate-limit-server';

export type SignInErrorCode =
  | 'invalidCredentials'
  | 'accountDisabled'
  | 'unverified'
  | 'rateLimited'
  | 'unknown';

export interface SignInAdultInput {
  readonly locale: 'fr' | 'en';
  readonly email: string;
  readonly password: string;
  /** Chemin de retour relatif (préfixé locale). Validé serveur-side. */
  readonly nextPath?: string | null;
}

export type SignInAdultResult =
  | { readonly ok: true } // jamais retourné en pratique : le redirect Auth.js court-circuite
  | { readonly ok: false; readonly code: SignInErrorCode };

/**
 * Valide et retourne un chemin de redirection post-connexion.
 *
 * Refuse les URL absolues, les protocoles et les doubles-slash pour
 * éviter l'open-redirect. Retourne `/${locale}/accueil` par défaut
 * (tableau de bord apprenant) plutôt que la vitrine publique.
 */
function safeNextPath(locale: 'fr' | 'en', candidate: string | null | undefined): string {
  const fallback = `/${locale}/accueil`;
  if (!candidate) return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.includes('\\') || candidate.includes('://')) return fallback;
  return candidate;
}

export async function signInAdult(input: SignInAdultInput): Promise<SignInAdultResult> {
  const redirectTo = safeNextPath(input.locale, input.nextPath ?? null);
  const ip = currentClientIp();
  const email = input.email.trim().toLowerCase();
  const rateLimitKey = `${ip}:${email}`;

  // Rate limit par IP. Discriminant secondaire par email pour ne pas
  // bloquer un quartier entier derrière un NAT au premier email visé.
  const limited = await checkRateLimit({
    bucket: 'signin',
    key: rateLimitKey,
  });
  if (!limited.allowed) {
    logger.warn('auth.signin.rate_limited', { keyHash: limited.keyHash });
    return { ok: false, code: 'rateLimited' };
  }

  try {
    await signIn('credentials', {
      email,
      password: input.password,
      redirectTo,
    });
    // Si on arrive ici (rare : tests, mock), pas d'échec.
    return { ok: true };
  } catch (e) {
    // Re-lance le redirect Next pour qu'il se propage normalement.
    if (
      typeof e === 'object' &&
      e !== null &&
      'digest' in e &&
      typeof (e as { digest?: unknown }).digest === 'string' &&
      ((e as { digest: string }).digest.startsWith('NEXT_REDIRECT') ||
        (e as { digest: string }).digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
    ) {
      throw e;
    }

    if (e instanceof AuthError) {
      // CredentialsSignin couvre :
      //   - mauvais email/mot de passe
      //   - email non vérifié (Credentials.authorize() retourne null)
      //   - compte désactivé (idem)
      // On ne distingue PAS côté UI (anti-énumération) — toujours
      // « inv