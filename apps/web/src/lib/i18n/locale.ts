/**
 * Helpers i18n côté App Router.
 *
 * Centralise la résolution de la locale à partir des params de route
 * (`/[locale]/...`) et expose `getDictionary(locale)` qui charge les
 * messages du paquet `@eduquiz/i18n`. Tout est synchrone : les
 * dictionnaires sont embarqués au build.
 */
import { DEFAULT_LOCALE, getMessages, isLocale, type Locale, type Messages } from '@eduquiz/i18n';
import { notFound } from 'next/navigation';

export interface LocaleRouteParams {
  readonly locale: string;
}

/**
 * Résout et valide un paramètre de route `[locale]`. Renvoie 404 si la
 * locale n'est pas supportée — ce qui ne devrait pas arriver en
 * pratique grâce au middleware, mais constitue un rempart
 * supplémentaire (typosquatting de path, partage de lien corrompu).
 */
export function resolveLocaleParam(rawLocale: string): Locale {
  if (!isLocale(rawLocale)) {
    notFound();
  }
  return rawLocale;
}

/**
 * Version non-throwing pour usages hors App Router (scripts, tests).
 */
export function safeResolveLocale(rawLocale: string | undefined): Locale {
  return rawLocale && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
}

/**
 * Charge le dictionnaire d'une locale résolue.
 */
export function getDictionary(locale: Locale): Messages {
  return getMessages(locale);
}

export { DEFAULT_LOCALE };
export type { Locale, Messages };
