/**
 * Middleware Next.js — détection de locale + protection des zones
 * authentifiées.
 *
 * Composition de deux préoccupations exécutées dans cet ordre :
 *
 *   1. **i18n**. Toutes les pages publiques sont servies sous
 *      `/[locale]/...` (`fr`, `en`). Si la requête arrive sans préfixe,
 *      on redirige vers la locale détectée (cookie → Accept-Language →
 *      DEFAULT_LOCALE).
 *
 *   2. **Auth**. Une fois la locale présente, on délègue à Auth.js v5
 *      (`auth(...)`) qui consomme `authConfigEdge.callbacks.authorized`
 *      pour décider de l'accès aux zones protégées
 *      (`/[locale]/dashboard/*`, `/parent/*`, `/admin/*`). Pour le reste,
 *      la requête passe librement.
 *
 * Le middleware tourne sur Edge runtime → on importe uniquement
 * `@eduquiz/auth/edge`. Aucun accès Prisma ici.
 */

import { authConfigEdge } from '@eduquiz/auth/edge';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocaleFromAcceptLanguage,
  isLocale,
  type Locale,
} from '@eduquiz/i18n';
import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;
const SKIP_PREFIXES = [
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export const config = {
  matcher: [
    // Tout sauf api/, _next/static, _next/image et fichiers à extension.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

/**
 * Wrapper Auth.js Edge — instancié une seule fois au boot du
 * middleware. Expose `auth` qui est un `(req) => NextResponse | void`
 * que l'on chaîne avec notre logique i18n.
 */
const { auth: authMiddleware } = NextAuth(authConfigEdge);

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Génère un ID de requête lisible (8 octets hex). On évite `crypto.
 * randomUUID()` qui est verbeux pour les logs ; 16 caractères suffisent
 * pour une corrélation sur quelques heures de trafic.
 */
function generateRequestId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Composition i18n → auth. Auth.js attend une fonction `(req, ctx)` et
 * fournit `req.auth`. On l'enveloppe pour intercaler l'étape locale
 * avant la décision d'accès.
 */
export default authMiddleware((request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // 0. Request ID. Si l'amont (Traefik, Cloudflare) en a déjà posé un,
  // on le respecte ; sinon on en génère un. Le header est posé sur la
  // requête (pour que les Server Components et Route Handlers le voient
  // via `headers()`) et copié sur la réponse pour le client.
  const reqId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, reqId);

  function passthrough(): NextResponse {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(REQUEST_ID_HEADER, reqId);
    return response;
  }

  // 1. Bypass des chemins techniques.
  if (
    SKIP_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_FILE.test(pathname)
  ) {
    return passthrough();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // 2. Locale absente → redirection vers la locale détectée.
  if (!first || !isLocale(first)) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const acceptLanguage = request.headers.get('accept-language');

    const target: Locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : detectLocaleFromAcceptLanguage(acceptLanguage);

    const url = request.nextUrl.clone();
    url.pathname = `/${target}${pathname === '/' ? '' : pathname}`;

    const response = NextResponse.redirect(url, 307);
    response.headers.set(REQUEST_ID_HEADER, reqId);
    response.cookies.set(LOCALE_COOKIE, target, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  // 3. Locale présente → la décision d'accès est portée par
  //    `authConfigEdge.callbacks.authorized`. Si ce callback retourne
  //    `false`, Auth.js redirige automatiquement vers `pages.signIn`
  //    en préservant l'URL d'origine via `?callbackUrl=...`.
  return passthrough();
});

// Re-export utilitaire pour les tests.
export { LOCALE_COOKIE, SUPPORTED_LOCALES, DEFAULT_LOCALE };
