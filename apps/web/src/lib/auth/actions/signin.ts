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

export type SignInErrorCode =
  | 'invalidCredentials'
  | 'accountDisabled'
  | 'unverified'
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

/** Refuse les URL absolues / protocole / `//` pour éviter l'open-redirect. */
function safeNextPath(locale: 'fr' | 'en', candidate: string | null | undefined): string {
  if (!candidate) return `/${locale}`;
  if (!candidate.startsWith('/')) return `/${locale}`;
  if (candidate.startsWith('//')) return `/${locale}`;
  if (candidate.includes('\\') || candidate.includes('://')) return `/${locale}`;
  return candidate;
}

export async function signInAdult(input: SignInAdultInput): Promise<SignInAdultResult> {
  const redirectTo = safeNextPath(input.locale, input.nextPath ?? null);

  try {
    await signIn('credentials', {
      email: input.email.trim().toLowerCase(),
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
      // « invalidCredentials ». La vraie raison est tracée dans
      // AuditLog par `logFailedSignIn` côté provider.
      return { ok: false, code: 'invalidCredentials' };
    }

    return { ok: false, code: 'unknown' };
  }
}
