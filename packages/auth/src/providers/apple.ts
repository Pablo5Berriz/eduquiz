/**
 * Provider Sign in with Apple.
 *
 * Activé uniquement si `AUTH_APPLE_ID` (Service ID) et `AUTH_APPLE_SECRET`
 * (JWT signé avec la clé privée Apple .p8) sont renseignés. La
 * génération du `AUTH_APPLE_SECRET` est documentée dans le README du
 * paquet (commande `openssl` + outil interne pour signer le JWT).
 *
 * Particularités Apple :
 *   - Le scope `email` n'est exposé QU'à la première connexion. Auth.js
 *     v5 gère ce cas et stocke l'email dès la première création de
 *     compte. Lors des connexions suivantes, l'email vient du cookie
 *     stocké côté Apple — invisible côté serveur.
 *   - L'option `checks: ['pkce']` doit être désactivée car Apple ne le
 *     supporte pas. Auth.js le sait et applique la bonne config par
 *     défaut.
 */

import Apple from 'next-auth/providers/apple';

import type { AuthEnv } from '../env.js';
import type { Provider } from 'next-auth/providers';

export function appleProvider(env: AuthEnv): Provider {
  return Apple({
    clientId: env.AUTH_APPLE_ID,
    clientSecret: env.AUTH_APPLE_SECRET,
  });
}
