import { DEFAULT_LOCALE, getMessages, t } from '@eduquiz/i18n';

import type { JSX } from 'react';

/**
 * Page d'accueil publique d'EduQuiz.
 *
 * Contenu minimal bilingue (locale figée à FR tant que la détection
 * dynamique n'est pas en place). Les CTA pointent sur des routes qui
 * n'existent pas encore ; elles seront branchées à l'étape 1.x.
 */
export default function HomePage(): JSX.Element {
  const messages = getMessages(DEFAULT_LOCALE);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {t(messages, 'common.appName')}
        </span>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t(messages, 'home.heroTitle')}
        </h1>

        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          {t(messages, 'home.heroSubtitle')}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/auth/sign-up"
            className="inline-flex min-h-touch-min items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:ring-focus focus-visible:ring-brand-500"
          >
            {t(messages, 'home.ctaPrimary')}
          </a>
          <a
            href="/catalogue"
            className="inline-flex min-h-touch-min items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {t(messages, 'home.ctaSecondary')}
          </a>
        </div>

        <p className="mt-12 text-xs text-slate-500 dark:text-slate-400">
          {t(messages, 'common.tagline')}
        </p>
      </section>
    </main>
  );
}
