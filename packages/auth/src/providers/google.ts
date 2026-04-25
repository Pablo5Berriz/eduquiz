/**
 * Provider Google OAuth (OpenID Connect).
 *
 * Activé uniquement si `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` sont
 * renseignés (cf. `env.ts` → `isProviderConfigured`). En dev local,
 * laisser vide les deux variables pour désactiver proprement.
 *
 * Configuration côté Google Cloud Console requise :
 *   - Type d'application : Web
 *   - Origines JS autorisées : `http://localhost:3000`, puis `https://eduquiz.ca`
 *   - URI de redirection : `<AUTH_URL>/api/auth/callback/google`
 *
 * Le scope `openid email profile` couvre les besoins du flux : email
 * (identifiant), name + picture pour préremplir le profil.
 */

import Google from 'next-auth/providers/google';

import type { AuthEnv } from '../env.js';
import type { Provider } from 'next-auth/providers';

export function googleProvider(env: AuthEnv): Provider {
  return Google({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
    authorization: { params: { scope: 'openid email profile', prompt: 'select_account' } },
    // Force l'usage du flux `code` (PKCE par défaut depuis Auth.js v5).
    checks: ['pkce', 'state'],
  });
}
