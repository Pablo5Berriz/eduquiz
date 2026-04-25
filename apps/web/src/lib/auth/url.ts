/**
 * Petits helpers d'URL pour les flux d'authentification.
 *
 * Utiliser `getCanonicalAuthUrl(path)` pour construire un lien absolu
 * basé sur `AUTH_URL` (validé par `@eduquiz/auth/env`). Indispensable
 * pour les emails (le destinataire ouvrira le lien depuis son client
 * mail, pas dans le contexte HTTP de l'app — donc pas de relatif).
 */

import { getAuthEnv } from '@eduquiz/auth/env';

/**
 * Concatène `AUTH_URL` et un chemin (avec ou sans slash de tête).
 * Normalise le slash de jonction.
 */
export function getCanonicalAuthUrl(path: string): string {
  const env = getAuthEnv();
  const base = env.AUTH_URL.replace(/\/+$/, '');
  const tail = path.startsWith('/') ? path : `/${path}`;
  return `${base}${tail}`;
}

/**
 * Masque partiellement un email pour l'afficher sur l'écran 22 sans
 * exposer la totalité de l'identifiant. Conserve la première lettre,
 * ajoute trois étoiles, garde le `@domaine`. Ex : `paul@gmail.com` →
 * `p***@gmail.com`.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.charAt(0);
  return `${visible}***${domain}`;
}
