import { getMessages, t } from '@eduquiz/i18n';
import { Button, Container, cn } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../lib/i18n/locale';

import type { JSX } from 'react';

/**
 * Page d'accueil bilingue d'EduQuiz.
 *
 * Squelette hero + tagline. Les sections (features, subjects, pricing,
 * testimonials) seront enrichies à l'étape 1.2 avec les écrans vitrine
 * complets. Ici on valide surtout que le câblage i18n dynamique marche
 * de bout en bout : FR sous `/fr`, EN sous `/en`, bascule via le
 * LocaleSwitcher.
 */
export default function LocalizedHomePage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <Container width="lg" className="py-16 sm:py-24">
      <section className="flex flex-col items-center gap-8 text-center">
        <span
          className={cn(
            'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600',
            'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
          )}
        >
          {t(messages, 'common.appName')}
        </span>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t(messages, 'home.heroTitle')}
        </h1>

        <p className="max-w-2xl text-balance text-lg text-slate-600 dark:text-slate-300">
          {t(messages, 'home.heroSubtitle')}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/${locale}/inscription`} className="inline-flex">
            <Button variant="primary" size="lg">
              {t(messages, 'home.ctaPrimary')}
            </Button>
          </Link>

          <Link href={`/${locale}/matieres`} className="inline-flex">
            <Button variant="secondary" size="lg">
              {t(messages, 'home.ctaSecondary')}
            </Button>
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-500 dark:text-slate-400">
          {t(messages, 'common.tagline')}
        </p>
      </section>
    </Container>
  );
}
