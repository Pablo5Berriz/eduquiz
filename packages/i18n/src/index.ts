/**
 * Point d'entrée du paquet @eduquiz/i18n.
 *
 * Fournit un minimum viable :
 *   - DEFAULT_LOCALE, SUPPORTED_LOCALES
 *   - getMessages(locale) : charge le JSON de la locale demandée
 *   - t(messages, key)    : lookup simple avec clés pointées
 *
 * Le câblage de bibliothèque (next-intl côté web, i18next côté mobile)
 * viendra plus tard. Ce module reste volontairement dépourvu de
 * dépendance runtime pour pouvoir être importé depuis n'importe quel
 * paquet du monorepo (y compris @eduquiz/db pour les seeds).
 */

import enMessages from './locales/en.json';
import frMessages from './locales/fr.json';

export const DEFAULT_LOCALE = 'fr' as const;
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type Messages = typeof frMessages;

const messagesByLocale: Record<Locale, Messages> = {
  fr: frMessages,
  en: enMessages as Messages,
};

/**
 * Retourne le dictionnaire de messages pour la locale demandée. Si la
 * locale n'est pas supportée on retombe silencieusement sur la locale
 * par défaut (FR).
 */
export function getMessages(locale: string | undefined): Messages {
  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return messagesByLocale[locale as Locale];
  }
  return messagesByLocale[DEFAULT_LOCALE];
}

/**
 * Résolution d'une clé pointée (ex. "home.heroTitle") dans un
 * dictionnaire. Retourne la clé elle-même si elle est absente, ce qui
 * permet de repérer visuellement les traductions manquantes sans faire
 * planter le rendu.
 */
export function t(messages: Messages, key: string): string {
  const parts = key.split('.');
  // Le dictionnaire est strictement typé, on autorise ponctuellement un
  // accès dynamique via `unknown` plutôt que `any`.
  let node: unknown = messages;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof node === 'string' ? node : key;
}

/**
 * Normalise une locale BCP-47 (ex. "fr-CA", "en-US") vers une locale
 * courte supportée. Retourne la locale par défaut en cas d'échec.
 */
export function normalizeLocale(input: string | undefined | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const short = input.slice(0, 2).toLowerCase();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(short)) {
    return short as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Type-guard de locale. Pratique pour valider un paramètre de route
 * `[locale]` côté Next sans relancer la normalisation.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Variante interpolante de {@link t}. Remplace les placeholders de la
 * forme `{name}` par les valeurs fournies. Les valeurs absentes sont
 * laissées telles quelles afin d'être visibles en cas d'oubli.
 *
 * Exemple :
 *   tf(messages, 'footer.rights', { year: 2026 }) // "© 2026 …"
 */
export function tf(
  messages: Messages,
  key: string,
  values: Readonly<Record<string, string | number>> = {},
): string {
  const raw = t(messages, key);
  if (raw === key) return raw;
  return raw.replace(/\{(\w+)\}/g, (_match, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return `{${name}}`;
    const v = values[name];
    return String(v);
  });
}

/**
 * Résout une clé pointée vers un tableau de chaînes. Utile pour les
 * listes de contenu (puces, étapes, paragraphes de pages légales) que
 * l'on préfère garder dans le dictionnaire JSON plutôt qu'en dur dans
 * les composants. Retourne un tableau vide si la clé est absente ou ne
 * pointe pas vers un tableau d'éléments `string`.
 *
 * Exemple :
 *   tList(messages, 'home.trust.items') // ["Aligné PFEQ", "Hébergé à Montréal", ...]
 */
export function tList(messages: Messages, key: string): readonly string[] {
  const parts = key.split('.');
  let node: unknown = messages;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }
  if (!Array.isArray(node)) return [];
  return node.filter((item): item is string => typeof item === 'string');
}

/**
 * Détecte la meilleure locale supportée à partir d'un en-tête
 * `Accept-Language` (RFC 9110). Stratégie naïve : on cherche la
 * première étiquette commençant par `fr-` ou `fr`, puis `en-` ou `en`,
 * en respectant l'ordre du client. Pas de gestion `q=` à ce stade —
 * suffisant pour FR ↔ EN.
 */
export function detectLocaleFromAcceptLanguage(header: string | undefined | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(',')
    .map((tag) => tag.split(';')[0]?.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag));
  for (const tag of tags) {
    if (tag.startsWith('fr')) return 'fr';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}
