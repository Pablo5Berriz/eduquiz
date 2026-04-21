/**
 * Sélecteur de langue (client component).
 *
 * Bascule la locale courante via une redirection (navigation dure) et
 * persiste le choix dans le cookie `NEXT_LOCALE` pour les visites
 * futures. Rendu sous forme de deux liens `<a>` plutôt qu'un menu :
 *   - accessible sans JS ;
 *   - annoncé par les lecteurs d'écran avec le bon label ;
 *   - indexable par les moteurs (hreflang).
 *
 * Le composant est marqué `'use client'` uniquement pour écrire le
 * cookie côté navigateur au clic. Les liens restent fonctionnels en
 * dégradé JS désactivé (le middleware relira le cookie au prochain
 * chargement s'il existe déjà, sinon la nav suffit).
 */
'use client';

import { SUPPORTED_LOCALES, type Locale, tf, type Messages } from '@eduquiz/i18n';
import { cn } from '@eduquiz/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import type { JSX, MouseEvent } from 'react';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export interface LocaleSwitcherProps {
  readonly currentLocale: Locale;
  readonly messages: Messages;
  readonly className?: string;
}

/**
 * Remplace le premier segment du pathname par la locale cible.
 * Le pathname incluant déjà la locale courante (middleware garantit),
 * on opère un simple splice.
 */
function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${locale}`;
  segments[0] = locale;
  return `/${segments.join('/')}`;
}

export function LocaleSwitcher({
  currentLocale,
  messages,
  className,
}: LocaleSwitcherProps): JSX.Element {
  const pathname = usePathname();

  const persist = useCallback((locale: Locale) => {
    if (typeof document === 'undefined') return;
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${String(oneYear)}; SameSite=Lax`;
  }, []);

  return (
    <nav
      aria-label={tf(messages, 'footer.localeLabel')}
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale;
        const href = withLocale(pathname, locale);
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={isActive ? 'true' : undefined}
            aria-label={tf(messages, 'locale.switchTo', { locale: locale.toUpperCase() })}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              // La navigation reste standard, on se contente de poser
              // le cookie pour que la prochaine visite sans préfixe
              // retombe sur le bon `[locale]`.
              persist(locale);
              // Pas de preventDefault : on laisse Next naviguer.
              void event;
            }}
            className={cn(
              'inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-1 font-semibold uppercase tracking-wide',
              'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
