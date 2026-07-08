/**
 * Configuration Auth.js v5 « Edge-safe ».
 *
 * Pourquoi un fichier dédié ? Le middleware Next.js tourne sur Edge
 * runtime, qui ne supporte ni les bindings natifs (argon2 = N-API) ni
 * Prisma (qui s'appuie sur des moteurs binaires). Le middleware doit
 * donc importer une variante de la config sans :
 *   - Adapter Prisma
 *   - Provider Credentials (qui touche à la DB)
 *   - Provider Apple/Google (lourdeur OIDC, mais surtout inutile pour
 *     juste lire le JWT existant au middleware)
 *
 * Cette variante expose uniquement la stratégie JWT + les
 * callbacks de jwt/session pour qu'`auth()` puisse résoudre la session
 * depuis le cookie. Les actions « lourdes » (signIn, signOut) et la
 * révocation stricte sont effectuées via le runtime Node.js.
 *
 * Pattern recommandé par la doc Auth.js v5 :
 * https://authjs.dev/guides/edge-compatibility
 */

import { Locale, UserRole } from './constants.js';

import type { NextAuthConfig } from 'next-auth';

function optionalJwtUser<T>(user: T): Partial<T> | undefined {
  return user ?? undefined;
}

const COOKIE_PREFIX =
  process.env.NODE_ENV === 'production' ? '__Secure-eduquiz' : 'eduquiz';

export const authConfigEdge: NextAuthConfig = {
  // Pas d'adapter ici : Edge ne sert qu'à lire le JWT chiffré porté par
  // le cookie. Les handlers Node valident ensuite `sessionVersion`
  // contre la DB pour les surfaces sensibles.
  session: { strategy: 'jwt' },

  trustHost: true,

  // Aucun provider Edge — le middleware ne fait que lire la session.
  providers: [],

  pages: {
    signIn: '/connexion',
    signOut: '/deconnexion',
    error: '/connexion',
    verifyRequest: '/verification-email',
  },

  cookies: {
    sessionToken: {
      name: `${COOKIE_PREFIX}.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${COOKIE_PREFIX}.callback-url`,
      options: { sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
    },
    csrfToken: {
      name: `${COOKIE_PREFIX}.csrf-token`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
    },
  },

  callbacks: {
    /**
     * Recopie les extras EduQuiz dans le JWT au signin et à chaque
     * actualisation. Côté Edge, on n'a pas accès à la DB : le JWT peut
     * donc être temporairement stale. Les helpers Node comparent
     * `sessionVersion` et l'état du compte à la DB avant les actions
     * sensibles.
     */
    jwt({ token, user }) {
      const maybeUser = optionalJwtUser(user);
      if (maybeUser) {
        if (maybeUser.id) token.sub = maybeUser.id;          // ← garde, pas d'assignation si undefined
        token.role = maybeUser.role ?? token.role ?? UserRole.LEARNER_ADULT;
        token.locale = maybeUser.locale ?? token.locale ?? Locale.FR;
        token.emailVerifiedAt = maybeUser.emailVerifiedAt ?? token.emailVerifiedAt ?? null;
        token.disabledAt = maybeUser.disabledAt ?? token.disabledAt ?? null;
        token.deletedAt = maybeUser.deletedAt ?? token.deletedAt ?? null;
        token.sessionVersion = maybeUser.sessionVersion ?? token.sessionVersion ?? 0;
      }
      return token;
    },

    /**
     * Reflète les extras du JWT dans `session.user` pour que les
     * Server Components et le middleware puissent lire `role`/`locale`
     * sans hit DB.
     */
    // Dans config-edge.ts — callback session
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;               // ← token.sub garanti string par le if
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.LEARNER_ADULT;
        session.user.locale = (token.locale as Locale | undefined) ?? Locale.FR;
        session.user.emailVerifiedAt = (token.emailVerifiedAt as Date | null | undefined) ?? null;
        session.user.disabledAt = (token.disabledAt as Date | null | undefined) ?? null;
        session.user.deletedAt = (token.deletedAt as Date | null | undefined) ?? null;
        session.user.sessionVersion =
          typeof token.sessionVersion === 'number' ? token.sessionVersion : 0;
      }
      return session;
    },

    /**
     * Authorization callback consommé par le middleware Next.js. À
     * partir de l'URL demandée, retourne `true` si l'accès est
     * autorisé, `false` pour rediriger vers `pages.signIn`, ou un
     * `NextResponse.redirect(...)` pour cibler une autre route.
     *
     * Zones protégées (tout utilisateur authentifié) :
     *   - `/[locale]/accueil`        → tableau de bord personnel
     *   - `/[locale]/apprendre(/*)` → catalogue et leçons
     *   - `/[locale]/quiz(/*)       → moteur de quiz
     *   - `/[locale]/profil(/*)     → profil utilisateur
     *   - `/[locale]/parametres(/*) → paramètres compte
     *
     * Zones protégées (rôle spécifique) :
     *   - `/[locale]/parent(/*)` → rôle PARENT ou ADMIN
     *   - `/[locale]/admin(/*)   → rôle ADMIN
     *
     * Tout le reste est public (vitrine, auth, pages légales…).
     *
     * Note : `requireAuthenticated()` dans les Server Components constitue
     * une deuxième couche de défense. Ce callback est la première ligne —
     * il évite de servir du HTML authentifié depuis l'Edge avant même
     * que le Server Component ait pu rediriger.
     */
    authorized({ auth, request: { nextUrl } }) {
      const segments = nextUrl.pathname.split('/').filter(Boolean);
      // Le premier segment est la locale (validée par le middleware
      // i18n). Le second indique la zone protégée.
      const zone = segments[1];
      const isProtected =
        zone === 'accueil' ||
        zone === 'apprendre' ||
        zone === 'quiz' ||
        zone === 'parent' ||
        zone === 'admin' ||
        zone === 'profil' ||
        zone === 'parametres';
      if (!isProtected) return true;
      if (!auth?.user) return false;
      // Zone admin : exige rôle ADMIN.
      if (zone === 'admin' && auth.user.role !== UserRole.ADMIN) return false;
      // Zone parent : PARENT ou ADMIN.
      if (zone === 'parent' && auth.user.role !== UserRole.PARENT && auth.user.role !== UserRole.ADMIN) {
        return false;
      }
      return true;
    },
  },
};
