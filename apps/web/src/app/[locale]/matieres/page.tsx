import { getMessages, t } from '@eduquiz/i18n';
import { Card, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { SUBJECT_KEYS, getSubjectSlug } from '../../../lib/catalog/subjects';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Matières » — écran 3 (hub des matières).
 *
 * Affiche les quatre matières disponibles sous forme de cartes
 * cliquables qui renvoient vers la page détail
 * `/[locale]/matieres/[subject]`. Les slugs sont résolus via le
 * dictionnaire i18n (cf. `lib/catalog/subjects.ts`).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.subjects'),
    description: t(messages, 'subjects.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/matieres`,
      languages: {
        fr: '/fr/matieres',
        en: '/en/matieres',
      },
    },
  };
}

export default function SubjectsHubPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'subjects.heroKicker')}
        title={t(messages, 'subjects.heroTitle')}
        subtitle={t(messages, 'subjects.heroSubtitle')}
      />

      <Container width="lg" className="py-20">
        <ul className="grid gap-6 sm:grid-cols-2">
          {SUBJECT_KEYS.map((key) => {
            const slug = getSubjectSlug(messages, key);
            const title = t(messages, `subjects.list.${key}.title`);
            const levels = t(messages, `subjects.list.${key}.levels`);
            const description = t(messages, `subjects.list.${key}.shortDescription`);
            return (
              <Card as="li" key={key} variant="surface" padding="lg">
                <Link
                  href={`/${locale}/matieres/${slug}`}
                  className="flex h-full flex-col gap-3 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                    {levels}
                  </span>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                    {t(messages, 'common.readMore')}
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </Card>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
