import { getMessages, t } from '@eduquiz/i18n';
import { Button, Card, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Témoignages » — écran 13 (placeholder).
 *
 * La V1 n'a pas encore de familles utilisatrices à citer. On affiche
 * donc un état vide transparent (« section en construction ») plutôt
 * que d'inventer des témoignages.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.testimonials'),
    description: t(messages, 'testimonials.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/temoignages`,
      languages: {
        fr: '/fr/temoignages',
        en: '/en/temoignages',
      },
    },
  };
}

export default function TestimonialsPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'testimonials.heroKicker')}
        title={t(messages, 'testimonials.heroTitle')}
        subtitle={t(messages, 'testimonials.heroSubtitle')}
      />

      <Container width="md" className="py-16">
        <Card variant="muted" padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t(messages, 'testimonials.emptyTitle')}
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t(messages, 'testimonials.emptyDescription')}
          </p>
          <div className="mt-6">
            <Link href={`/${locale}`} className="inline-flex">
              <Button variant="secondary" size="md">
                {t(messages, 'testimonials.cta')}
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </>
  );
}
