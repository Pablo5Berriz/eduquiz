/**
 * Helpers serveur pour l'authentification.
 *
 * À utiliser dans les Server Components, Server Actions et Route
 * Handlers. **Ne pas** importer ce module depuis le middleware Next.js
 * (Edge runtime — utiliser directement la session passée par le
 * middleware Auth.js).
 *
 * Tous les helpers s'appuient sur `auth()` (instancié dans
 * `apps/web/src/auth.ts`) qui résout la session depuis le cookie JWT.
 * Les helpers protégés relisent ensuite l'utilisateur en DB pour
 * appliquer la révocation stricte (`sessionVersion`) et éviter les
 * rôles/états obsolètes.
 */

import {
  ForbiddenError,
  UnauthenticatedError,
  isAccountActive,
  type AuthSessionUser,
} from '@eduquiz/auth/permissions';
import { ParentLinkState, UserRole, prismaService as prisma } from '@eduquiz/db';
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
 * Retourne l'utilisateur courant validé contre la DB ou `null`.
 * Un vieux JWT reste lisible par Auth.js jusqu'à son expiration, mais
 * devient inutilisable ici dès que `User.sessionVersion` a changé.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const session = await getSession();
  const sessionUser = session?.user;
  if (!sessionUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      locale: true,
      emailVerifiedAt: true,
      disabledAt: true,
      deletedAt: true,
      sessionVersion: true,
      profile: { select: { displayName: true, firstName: true, avatarUrl: true } },
    },
  });

  if (!dbUser) return null;
  if (sessionUser.sessionVersion !== dbUser.sessionVersion) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.profile?.displayName ?? dbUser.profile?.firstName ?? sessionUser.name ?? null,
    image: dbUser.profile?.avatarUrl ?? sessionUser.image ?? null,
    role: dbUser.role,
    locale: dbUser.locale,
    emailVerifiedAt: dbUser.emailVerifiedAt,
    disabledAt: dbUser.disabledAt,
    deletedAt: dbUser.deletedAt,
    sessionVersion: dbUser.sessionVersion,
  };
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

/**
 * Guard Loi 25 — Tâche 2.3.
 *
 * Un `LEARNER_MINOR` sans lien `VERIFIED` ne doit pas accéder au contenu
 * pédagogique. Redirige vers `/apprendre/relier-parent` si le mineur n'a
 * pas encore de parent confirmé.
 *
 * À appeler dans chaque Server Component du flux learning :
 * `/apprendre`, `/apprendre/[lesson]`, `/quiz/[id]`, `/quiz/[id]/resultat/[id]`.
 *
 * Les non-mineurs (LEARNER_ADULT, PARENT, ADMIN) passent sans requête DB.
 */
export async function guardMinorParentLink(user: AuthSessionUser, locale: string): Promise<void> {
  if (user.role !== UserRole.LEARNER_MINOR) return;

  const verified = await prisma.parentChildLink.findFirst({
    where: { childId: user.id, state: ParentLinkState.VERIFIED },
    select: { id: true },
  });

  if (!verified) {
    redirect(`/${locale}/apprendre/relier-parent`);
  }
}

export { UnauthenticatedError, ForbiddenError };
