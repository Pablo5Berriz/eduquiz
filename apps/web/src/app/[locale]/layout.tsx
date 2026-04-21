import { SUPPORTED_LOCALES, getMessages, t } from '@eduquiz/i18n';

import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { resolveLocaleParam, type LocaleRouteParams } from '../../lib/i18n/locale';

import type { Metadata, Viewport } from 'next';
import type { JSX, ReactNode } from 'react';

/**
 * Layout de segment `/[locale]`.
 *
 * Pose l'attribut `lang` correct sur `<html>` via `<html lang>` du
 * layout parent (Next ne laissant pas le segment enfant remplacer la
 * balise `<html>`, on rend le `lang` à la racine via la metadata
 * `alternates.languages` + un script injecté `<html lang={locale}>` n'est
 * pas possible ici ; on ajoute donc le `lang` côté `<main>` pour les
 * lecteurs d'écran avec `lang={locale}` sur le contenu).
 *
 * Expose :
 *   - Header public (nav, LocaleSwitcher, CTA).
 *   - Footer (liens, copyright, LocaleSwitcher).
 *   - Metadata dynamique par locale (title template, description, og,
 *     alternates hreflang pour SEO multilingue).
 */

export function generateStaticParams(): { locale: string }[] {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const title = t(messages, 'common.appName');
  const description = t(messages, 'common.tagline');

  return {
    title: {
      default: title,
      template: `%s — ${title}`,
    },
    description,
    applicationName: title,
    formatDetection: { telephone: false },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: '/fr',
        en: '/en',
        'x-default': '/fr',
      },
    },
    openGraph: {
      title,
      description,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function LocaleLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <div lang={locale} className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t(messages, 'common.skipToContent')}
      </a>

      <Header locale={locale} messages={messages} />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer locale={locale} messages={messages} />
    </div>
  );
}
