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
 *     juste lire la session existante au middleware)
 *
 * Cette variante expose uniquement la stratégie session + les
 * callbacks de jwt/session pour qu'`auth()` puisse résoudre la session
 * depuis le cookie. Les actions « lourdes » (signIn, signOut) sont
 * effectuées via le runtime Node.js.
 *
 * Pattern recommandé par la doc Auth.js v5 :
 * https://authjs.dev/guides/edge-compatibility
 */

import { Locale, UserRole } from '@eduquiz/db';

import type { NextAuthConfig } from 'next-auth';

const COOKIE_PREFIX =
  process.env.NODE_ENV === 'production' ? '__Secure-eduquiz' : 'eduquiz';

export const authConfigEdge: NextAuthConfig = {
  // Pas d'adapter ici → strategy obligatoirement « jwt » côté Edge.
  // La stratégie réelle (DB) reste celle de la config Node ; Edge ne
  // sert qu'à lire le JWT signé porté par le cookie de session.
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
     * actualisation. Côté Edge, on n'a pas accès à la DB pour
     * rafraîchir les valeurs — on s'appuie sur celles du JWT signé.
     * En cas de promotion/désactivation côté serveur, le changement
     * deviendra effectif au prochain refresh JWT (heure d'inactivité).
     */
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.role = user.role ?? token.role ?? UserRole.LEARNER_ADULT;
        token.locale = user.locale ?? token.locale ?? Locale.FR;
        token.emailVerifiedAt = user.emailVerifiedAt ?? token.emailVerifiedAt ?? null;
        token.disabledAt = user.disabledAt ?? token.disabledAt ?? null;
        token.deletedAt = user.deletedAt ?? token.deletedAt ?? null;
      }
      return token;
    },

    /**
     * Reflète les extras du JWT dans `session.user` pour que les
     * Server Components et le middleware puissent lire `role`/`locale`
     * sans hit DB.
     */
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.LEARNER_ADULT;
        session.user.locale = (token.locale as Locale | undefined) ?? Locale.FR;
        session.user.emailVerifiedAt = token.emailVerifiedAt ?? null;
        session.user.disabledAt = token.disabledAt ?? null;
        session.user.deletedAt = token.deletedAt ?? null;
      }
      return session;
    },

    /**
     * Authorization callback consommé par le middleware Next.js. À
     * partir de l'URL demandée, retourne `true` si l'accès est
     * autorisé, `false` pour rediriger vers `pages.signIn`, ou un
     * `NextResponse.redirect(...)` pour cibler une autre route.
     *
     * Zones protégées :
     *   - `/[locale]/profil(/*)`     → tout utilisateur authentifié
     *   - `/[locale]/parametres(/*)` → tout utilisateur authentifié
     *   - `/[locale]/dashboard(/*)`  → tout utilisateur authentifié
     *   - `/[locale]/parent(/*)`     → rôle PARENT ou ADMIN
     *   - `/[locale]/admin(/*)`      → rôle ADMIN
     * Tout le reste est public.
     */
    authorized({ auth, request: { nextUrl } }) {
      const segments = nextUrl.pathname.split('/').filter(Boolean);
      // Le premier segment est la locale (validée par le middleware
      // i18n). Le second indique la zone protégée.
      const zone = segments[1];
      const isProtected =
        zone === 'dashboard' ||
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
