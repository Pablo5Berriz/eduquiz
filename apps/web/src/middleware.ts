/**
 * Middleware Next.js — détection et préfixe de locale.
 *
 * Stratégie i18n d'EduQuiz :
 *   1. Toutes les pages publiques sont servies sous `/[locale]/...` où
 *      `[locale]` ∈ SUPPORTED_LOCALES (`fr`, `en`).
 *   2. Si la requête arrive sans préfixe de locale, on redirige (302)
 *      vers la locale détectée dans cet ordre :
 *        a. cookie `NEXT_LOCALE` posé par le LocaleSwitcher,
 *        b. en-tête `Accept-Language` du navigateur,
 *        c. DEFAULT_LOCALE (`fr`).
 *   3. Les routes API (`/api/*`), les assets statiques (`/_next/*`,
 *      fichiers avec extension) et les routes futures sans i18n sont
 *      passées sans rewrite.
 *
 * Le middleware ne fait pas de réécriture interne : on reste sur des
 * URLs canoniques préfixées, ce qui simplifie le SEO multilingue
 * (hreflang, sitemap par locale).
 */
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocaleFromAcceptLanguage,
  isLocale,
  type Locale,
} from '@eduquiz/i18n';
import { NextResponse, type NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';

// Préfixes qui ne doivent jamais être préfixés par une locale.
const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;
const SKIP_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico', '/robots.txt', '/sitemap.xml'];

export const config = {
  matcher: [
    // Tout sauf api/, _next/static, _next/image et fichiers à extension.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p)) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Cas 1 : URL déjà préfixée par une locale supportée → pass-through.
  if (first && isLocale(first)) {
    return NextResponse.next();
  }

  // Cas 2 : pas de locale → on en choisit une et on redirige.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = request.headers.get('accept-language');

  const target: Locale =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : detectLocaleFromAcceptLanguage(acceptLanguage);

  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.redirect(url, 307);
  // Persister le choix pour les visites suivantes.
  response.cookies.set(LOCALE_COOKIE, target, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

// Re-export utilitaire pour les éventuelles intégrations (tests, RSC).
export { LOCALE_COOKIE, SUPPORTED_LOCALES, DEFAULT_LOCALE };
