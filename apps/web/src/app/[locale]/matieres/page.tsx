import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { SUBJECT_KEYS, getSubjectSlug } from '../../../lib/catalog/subjects';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Matières » — écran 3 (hub des matières).
 *
 * Affiche les dix matières du programme québécois sous forme de cartes
 * cliquables (avec illustration) qui renvoient vers la page détail
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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECT_KEYS.map((key) => {
            const slug = getSubjectSlug(messages, key);
            const title = t(messages, `subjects.list.${key}.title`);
            const levels = t(messages, `subjects.list.${key}.levels`);
            const description = t(messages, `subjects.list.${key}.shortDescription`);
            const image = t(messages, `subjects.list.${key}.image`);
            const imageAlt = `${t(messages, 'subjects.detail.imageAlt')} — ${title}`;
            return (
              <li
                key={key}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <Link
                  href={`/${locale}/matieres/${slug}`}
                  className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={imageAlt}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex h-full flex-col gap-3 p-6">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                      {levels}
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                      {t(messages, 'common.readMore')}
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
