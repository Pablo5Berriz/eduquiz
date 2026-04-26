import { getMessages, t } from '@eduquiz/i18n';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Index `/[locale]/parametres` — sert d'introduction et liste des
 * sous-sections. La sidebar est rendue par le layout parent ; ici on
 * répète la liste sous forme de cartes pour le mobile et en cas
 * d'arrivée directe sur la racine.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.settings.title'),
    robots: { index: false, follow: false },
  };
}

export default function SettingsIndexPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const sections = [
    { key: 'account', href: `/${locale}/parametres/compte`, label: t(messages, 'account.settings.navigation.account') },
    { key: 'language', href: `/${locale}/parametres/langue`, label: t(messages, 'account.settings.navigation.language') },
    { key: 'data', href: `/${locale}/parametres/donnees`, label: t(messages, 'account.settings.navigation.data') },
    {
      key: 'deletion',
      href: `/${locale}/parametres/suppression`,
      label: t(messages, 'account.settings.navigation.deletion'),
      tone: 'danger' as const,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(messages, 'account.settings.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.settings.subtitle')}
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.key}>
            <Link
              href={s.href}
              className={
                s.tone === 'danger'
                  ? 'block rounded-xl border border-danger-200 bg-white px-4 py-3 text-sm font-medium text-danger-800 hover:border-danger-300 hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-danger-500 dark:border-danger-800 dark:bg-slate-900 dark:text-danger-200 dark:hover:border-danger-700 dark:hover:bg-danger-950/30'
                  : 'block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
              }
            >
              {s.label} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
