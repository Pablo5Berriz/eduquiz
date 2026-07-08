import { SUPPORTED_LOCALES, getMessages, t, tList } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '../../../../components/layout/PageHero';
import {
  LEVEL_KEYS,
  LEVEL_LABEL_KEY,
  SUBJECT_KEYS,
  getSubjectSlug,
  resolveSubjectKeyFromSlug,
} from '../../../../lib/catalog/subjects';
import { resolveLocaleParam } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Matière » détail (écrans 4 à 13 — une page par matière).
 *
 * Route dynamique `/[locale]/matieres/[subject]`. Le slug est validé
 * contre la liste `SUBJECT_KEYS` ; un slug inconnu déclenche `notFound()`.
 *
 * Contenu :
 *   - Hero avec kicker + titre + description courte + CTA
 *   - Illustration de matière (SVG placeholder le temps que les photos
 *     libres de droits soient téléchargées par le script dédié)
 *   - Description longue + carte latérale (niveaux, domaines, compétences)
 *   - Section « Ce que tu apprends, niveau par niveau » avec uniquement
 *     les niveaux où la matière figure officiellement au programme
 *
 * `generateStaticParams` pré-rend les 10 matières × 2 locales = 20 pages.
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
  const image = t(messages, `subjects.list.${subjectKey}.image`);
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
    openGraph: {
      title,
      description,
      images: [image],
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
  const image = t(messages, `subjects.list.${subjectKey}.image`);
  const imageAlt = `${t(messages, 'subjects.detail.imageAlt')} — ${title}`;

  const availableLevels = LEVEL_KEYS.filter(
    (level) => tList(messages, `subjects.list.${subjectKey}.byLevel.${level}`).length > 0,
  );

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

      <Container width="lg" className="py-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Image d'illustration. Les placeholders SVG sont remplacés
              par des photos libres de droits via scripts/download-subject-images.mjs. */}
          <img
            src={image}
            alt={imageAlt}
            className="h-56 w-full object-cover sm:h-72 md:h-96"
            loading="eager"
            decoding="async"
          />
        </div>
      </Container>

      <Container width="lg" className="pb-16">
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
      </Container>

      {availableLevels.length > 0 ? (
        <section
          aria-label={t(messages, 'subjects.detail.byLevelTitle')}
          className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <Container width="lg" className="py-16">
            <SectionHeading
              kicker=""
              title={t(messages, 'subjects.detail.byLevelTitle')}
              description={t(messages, 'subjects.detail.byLevelDescription')}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {availableLevels.map((level) => {
                const items = tList(messages, `subjects.list.${subjectKey}.byLevel.${level}`);
                return (
                  <Card key={level} variant="surface" padding="md">
                    <h3 className="text-base font-semibold text-brand-700 dark:text-brand-300">
                      {t(messages, LEVEL_LABEL_KEY[level])}
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand-500"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      <Container width="lg" className="py-12">
        <p>
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
