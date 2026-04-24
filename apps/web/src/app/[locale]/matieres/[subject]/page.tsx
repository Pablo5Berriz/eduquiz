import { SUPPORTED_LOCALES, getMessages, t, tList } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '../../../../components/layout/PageHero';
import {
  SUBJECT_KEYS,
  getSubjectSlug,
  resolveSubjectKeyFromSlug,
} from '../../../../lib/catalog/subjects';
import { resolveLocaleParam } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Matière » détail — écrans 4 à 7 (une page par matière).
 *
 * Route dynamique `/[locale]/matieres/[subject]`. Le slug est validé
 * contre la liste `SUBJECT_KEYS` ; un slug inconnu déclenche `notFound()`
 * et renvoie vers le `not-found.tsx` global de Next.
 *
 * `generateStaticParams` pré-rend les quatre combinaisons locale × slug
 * pour que le SSG produise 2 × 4 = 8 pages statiques.
 */

interface SubjectRouteParams {
  readonly locale: string;
  readonly subject: string;
}

export function generateStaticParams(): { locale: string; subject: string }[] {
  const params: { locale: string; subject: string }[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const messages = getMessages(locale);
    for (const key of SUBJECT_KEYS) {
      params.push({ locale, subject: getSubjectSlug(messages, key) });
    }
  }
  return params;
}

export function generateMetadata({ params }: { params: SubjectRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const subjectKey = resolveSubjectKeyFromSlug(messages, params.subject);
  if (!subjectKey) {
    return { title: t(messages, 'subjects.notFoundTitle') };
  }
  const title = t(messages, `subjects.list.${subjectKey}.title`);
  const description = t(messages, `subjects.list.${subjectKey}.shortDescription`);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/matieres/${params.subject}`,
      languages: {
        fr: `/fr/matieres/${params.subject}`,
        en: `/en/matieres/${params.subject}`,
      },
    },
  };
}

export default function SubjectDetailPage({
  params,
}: {
  readonly params: SubjectRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const subjectKey = resolveSubjectKeyFromSlug(messages, params.subject);
  if (!subjectKey) {
    notFound();
  }

  const title = t(messages, `subjects.list.${subjectKey}.title`);
  const levels = t(messages, `subjects.list.${subjectKey}.levels`);
  const shortDescription = t(messages, `subjects.list.${subjectKey}.shortDescription`);
  const longDescription = t(messages, `subjects.list.${subjectKey}.longDescription`);
  const topics = tList(messages, `subjects.list.${subjectKey}.topics`);
  const skills = tList(messages, `subjects.list.${subjectKey}.skills`);

  return (
    <>
      <PageHero
        kicker={`${t(messages, 'subjects.heroKicker')} · ${levels}`}
        title={title}
        subtitle={shortDescription}
        actions={
          <>
            <Link href={`/${locale}/inscription`} className="inline-flex">
              <Button variant="primary" size="lg">
                {t(messages, 'subjects.detail.ctaPrimary')}
              </Button>
            </Link>
            <Link href={`/${locale}/matieres`} className="inline-flex">
              <Button variant="secondary" size="lg">
                {t(messages, 'subjects.detail.ctaSecondary')}
              </Button>
            </Link>
          </>
        }
      />

      <Container width="lg" className="py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeading title={t(messages, 'common.appName')} kicker="" as="h2" />
            <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
              {longDescription}
            </p>
          </div>

          <Card variant="muted" padding="md" as="aside">
            <dl className="flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'subjects.detail.levelsLabel')}
                </dt>
                <dd className="text-slate-900 dark:text-slate-100">{levels}</dd>
              </div>

              <div className="flex flex-col gap-2">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'subjects.detail.topicsLabel')}
                </dt>
                <dd>
                  <ul className="flex flex-col gap-1.5">
                    {topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand-500"
                        />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>

              <div className="flex flex-col gap-2">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'subjects.detail.skillsLabel')}
                </dt>
                <dd>
                  <ul className="flex flex-col gap-1.5">
                    {skills.map((skill) => (
                      <li key={skill} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand-500"
                        />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <p className="mt-12">
          <Link
            href={`/${locale}/matieres`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <span aria-hidden="true">←</span>
            {t(messages, 'subjects.detail.backToList')}
          </Link>
        </p>
      </Container>
    </>
  );
}
