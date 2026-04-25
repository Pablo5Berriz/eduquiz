import { SUPPORTED_LOCALES, getMessages, t, tList } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '../../../../components/layout/PageHero';
import {
  SCHOOL_LEVEL_KEYS,
  getSchoolLevelSlug,
  getSubjectsForSchoolLevel,
  resolveSchoolLevelKeyFromSlug,
} from '../../../../lib/catalog/levels';
import { getSubjectSlug } from '../../../../lib/catalog/subjects';
import { resolveLocaleParam } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Niveau scolaire » détail.
 *
 * Route dynamique `/[locale]/niveaux/[level]`. Le slug est validé contre
 * la liste `SCHOOL_LEVEL_KEYS`. Un slug inconnu déclenche `notFound()`.
 *
 * Contenu :
 *   - Hero avec kicker, titre, âge propice, description courte, double CTA
 *   - Description longue + carte latérale (âge propice, objectifs)
 *   - Section « Matières au programme à ce niveau » : liste les matières
 *     dont la clé i18n contient au moins un élément pour le regroupement
 *     correspondant (cf. `getSubjectsForSchoolLevel`).
 *
 * `generateStaticParams` pré-rend les 9 niveaux × 2 locales = 18 pages.
 */

interface LevelRouteParams {
  readonly locale: string;
  readonly level: string;
}

export function generateStaticParams(): { locale: string; level: string }[] {
  const params: { locale: string; level: string }[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const messages = getMessages(locale);
    for (const key of SCHOOL_LEVEL_KEYS) {
      params.push({ locale, level: getSchoolLevelSlug(messages, key) });
    }
  }
  return params;
}

export function generateMetadata({ params }: { params: LevelRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const levelKey = resolveSchoolLevelKeyFromSlug(messages, params.level);
  if (!levelKey) {
    return { title: t(messages, 'levels.notFoundTitle') };
  }
  const title = t(messages, `levels.list.${levelKey}.title`);
  const description = t(messages, `levels.list.${levelKey}.shortDescription`);

  // Construit les slugs équivalents dans l'autre locale pour les
  // alternates `hreflang`. Si la résolution croisée échoue (ne devrait
  // jamais arriver puisque les neuf clés sont symétriques), on retombe
  // sur la racine de la section.
  const frSlug = getSchoolLevelSlug(getMessages('fr'), levelKey) || '';
  const enSlug = getSchoolLevelSlug(getMessages('en'), levelKey) || '';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/niveaux/${params.level}`,
      languages: {
        fr: `/fr/niveaux/${frSlug}`,
        en: `/en/niveaux/${enSlug}`,
      },
    },
  };
}

export default function SchoolLevelDetailPage({
  params,
}: {
  readonly params: LevelRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const levelKey = resolveSchoolLevelKeyFromSlug(messages, params.level);
  if (!levelKey) {
    notFound();
  }

  const title = t(messages, `levels.list.${levelKey}.title`);
  const age = t(messages, `levels.list.${levelKey}.age`);
  const shortDescription = t(messages, `levels.list.${levelKey}.shortDescription`);
  const longDescription = t(messages, `levels.list.${levelKey}.longDescription`);
  const goals = tList(messages, `levels.list.${levelKey}.goals`);

  const subjectsAtLevel = getSubjectsForSchoolLevel(messages, levelKey);

  return (
    <>
      <PageHero
        kicker={`${t(messages, 'levels.detail.heroKicker')} · ${age}`}
        title={title}
        subtitle={shortDescription}
        actions={
          <>
            <Link href={`/${locale}/inscription`} className="inline-flex">
              <Button variant="primary" size="lg">
                {t(messages, 'levels.detail.ctaPrimary')}
              </Button>
            </Link>
            <Link href={`/${locale}`} className="inline-flex">
              <Button variant="secondary" size="lg">
                {t(messages, 'levels.detail.ctaSecondary')}
              </Button>
            </Link>
          </>
        }
      />

      <Container width="lg" className="py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-base text-slate-700 dark:text-slate-200 sm:text-lg">
              {longDescription}
            </p>
          </div>

          <Card variant="muted" padding="md" as="aside">
            <dl className="flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'levels.detail.ageLabel')}
                </dt>
                <dd className="text-slate-900 dark:text-slate-100">{age}</dd>
              </div>

              {goals.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                    {t(messages, 'levels.detail.goalsLabel')}
                  </dt>
                  <dd>
                    <ul className="flex flex-col gap-1.5">
                      {goals.map((goal) => (
                        <li key={goal} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand-500"
                          />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </div>
      </Container>

      {subjectsAtLevel.length > 0 ? (
        <section
          aria-label={t(messages, 'levels.detail.subjectsLabel')}
          className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <Container width="lg" className="py-16">
            <SectionHeading
              kicker=""
              title={t(messages, 'levels.detail.subjectsLabel')}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectsAtLevel.map((subjectKey) => {
                const subjectTitle = t(messages, `subjects.list.${subjectKey}.title`);
                const subjectShort = t(
                  messages,
                  `subjects.list.${subjectKey}.shortDescription`,
                );
                const subjectSlug = getSubjectSlug(messages, subjectKey);
                return (
                  <li
                    key={subjectKey}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <Link
                      href={`/${locale}/matieres/${subjectSlug}`}
                      className="flex h-full flex-col gap-2 p-5 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
                    >
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {subjectTitle}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {subjectShort}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                        {t(messages, 'common.readMore')}
                        <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      ) : null}

      <Container width="lg" className="py-12">
        <p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <span aria-hidden="true">←</span>
            {t(messages, 'levels.detail.backToList')}
          </Link>
        </p>
      </Container>
    </>
  );
}
