/**
 * Helpers serveur pour l'authentification.
 *
 * À utiliser dans les Server Components, Server Actions et Route
 * Handlers. **Ne pas** importer ce module depuis le middleware Next.js
 * (Edge runtime — utiliser directement la session passée par le
 * middleware Auth.js).
 *
 * Tous les helpers s'appuient sur `auth()` (instancié dans
 * `apps/web/src/auth.ts`) qui résout la session depuis le cookie en
 * faisant une lecture DB (stratégie `database`).
 */

import {
  ForbiddenError,
  UnauthenticatedError,
  isAccountActive,
  type AuthSessionUser,
} from '@eduquiz/auth/permissions';
import { UserRole } from '@eduquiz/db';
import { redirect } from 'next/navigation';

import { auth } from '../../auth';

/**
 * Retourne la session courante ou `null`. Lecture DB : à mémoriser au
 * niveau du Server Component si plusieurs lectures sont nécessaires.
 */
export async function getSession() {
  return auth();
}

/**
 * Retourne l'utilisateur courant ou `null`. Sucre syntaxique sur
 * `getSession()` qui évite le `?.user` à chaque appel.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Exige un utilisateur connecté. Redirige vers `/connexion?next=...`
 * si non connecté. À utiliser dans les Server Components des routes
 * `/dashboard/*`, `/parent/*`, `/admin/*`.
 *
 * @param locale — locale active, pour préserver le préfixe d'URL
 * @param nextPath — chemin de retour post-login
 */
export async function requireAuthenticated(
  locale: string,
  nextPath: string,
): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/connexion?next=${encodeURIComponent(nextPath)}`);
  }
  if (!isAccountActive(user)) {
    // Compte désactivé/supprimé : on déconnecte côté UI en redirigeant
    // vers la page d'accueil avec un message (à enrichir en 1.6).
    redirect(`/${locale}/?disabled=1`);
  }
  return user;
}

/**
 * Variante de `requireAuthenticated` avec contrôle de rôle. Redirige
 * vers `/` si le rôle ne correspond pas (pas vers `/connexion` car
 * l'utilisateur EST connecté, juste pas autorisé).
 */
export async function requireRoleOrRedirect(
  locale: string,
  expected: UserRole,
  nextPath: string,
): Promise<AuthSessionUser> {
  const user = await requireAuthenticated(locale, nextPath);
  if (user.role !== expected && user.role !== UserRole.ADMIN) {
    redirect(`/${locale}/?forbidden=1`);
  }
  return user;
}

/**
 * Pour les Route Handlers (`app/api/**`) qui doivent retourner du JSON
 * : retourne soit l'utilisateur, soit lève une erreur typée que la
 * route peut convertir en `Response` 401/403.
 */
export async function requireApiUser(): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  if (!isAccountActive(user)) throw new ForbiddenError('Compte désactivé');
  return user;
}

export { UnauthenticatedError, ForbiddenError };
