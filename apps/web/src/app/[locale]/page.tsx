import { getMessages, t, tList } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading, cn } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../lib/i18n/locale';

import type { Messages } from '@eduquiz/i18n';
import type { JSX } from 'react';

/**
 * Page d'accueil bilingue d'EduQuiz — écran 1 de la vitrine publique.
 *
 * Sections (toutes en server components, aucune dépendance client) :
 *   1. Hero : kicker + titre + sous-titre + double CTA.
 *   2. Trust strip : quatre signes de confiance (PFEQ, hébergement,
 *      Loi 25, bilingue).
 *   3. Features teaser : trois piliers, carte cliquable vers la page
 *      Fonctionnalités pour aller plus loin.
 *   4. Subjects teaser : quatre matières, grille 2×2 sur mobile, 4 col
 *      sur desktop.
 *   5. How it works : trois étapes numérotées.
 *   6. Pricing teaser : mention du plan gratuit + redirection vers la
 *      page Tarifs.
 *   7. Final CTA : encart avec double appel à l'action.
 *
 * On privilégie une structure `<section aria-labelledby="…">` propre et
 * des landmarks clairs (un `<h1>` unique, `<h2>` par section).
 */

const FEATURE_ITEMS = [
  { titleKey: 'home.features.item1Title', descKey: 'home.features.item1Description' },
  { titleKey: 'home.features.item2Title', descKey: 'home.features.item2Description' },
  { titleKey: 'home.features.item3Title', descKey: 'home.features.item3Description' },
] as const;

const STEP_ITEMS = [
  { titleKey: 'home.howItWorks.step1Title', descKey: 'home.howItWorks.step1Description' },
  { titleKey: 'home.howItWorks.step2Title', descKey: 'home.howItWorks.step2Description' },
  { titleKey: 'home.howItWorks.step3Title', descKey: 'home.howItWorks.step3Description' },
] as const;

const SUBJECT_KEYS = [
  'mathematiques',
  'francais',
  'sciences',
  'histoire',
] as const;

function getSubjectCopy(
  messages: Messages,
  key: (typeof SUBJECT_KEYS)[number],
): { title: string; description: string } {
  return {
    title: t(messages, `subjects.list.${key}.title`),
    description: t(messages, `subjects.list.${key}.shortDescription`),
  };
}

export default function LocalizedHomePage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const trustItems = tList(messages, 'home.trust.items');

  return (
    <>
      {/* 1. Hero */}
      <section aria-labelledby="home-hero-title" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-slate-950 dark:to-slate-950"
        />
        <Container width="lg" className="relative py-20 sm:py-28">
          <div className="flex flex-col items-center gap-6 text-center">
            <span
              className={cn(
                'rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700',
                'dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300',
              )}
            >
              {t(messages, 'home.heroKicker')}
            </span>

            <h1
              id="home-hero-title"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              {t(messages, 'home.heroTitle')}
            </h1>

            <p className="max-w-2xl text-balance text-lg text-slate-600 dark:text-slate-300">
              {t(messages, 'home.heroSubtitle')}
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
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
          </div>
        </Container>
      </section>

      {/* 2. Trust strip */}
      <section
        aria-label={t(messages, 'home.trust.title')}
        className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      >
        <Container width="lg" className="py-6">
          <p className="sr-only">{t(messages, 'home.trust.title')}</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 3. Features teaser */}
      <section aria-labelledby="home-features-title">
        <Container width="lg" className="py-20">
          <SectionHeading
            kicker={t(messages, 'home.features.kicker')}
            title={<span id="home-features-title">{t(messages, 'home.features.title')}</span>}
            description={t(messages, 'home.features.description')}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ITEMS.map((feature) => (
              <Card as="li" key={feature.titleKey} variant="surface">
                <h3 className="text-lg font-semibold">{t(messages, feature.titleKey)}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t(messages, feature.descKey)}
                </p>
              </Card>
            ))}
          </ul>

          <p className="mt-8 text-center">
            <Link
              href={`/${locale}/fonctionnalites`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {t(messages, 'home.features.cta')}
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </Container>
      </section>

      {/* 4. Subjects teaser */}
      <section
        aria-labelledby="home-subjects-title"
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-20">
          <SectionHeading
            kicker={t(messages, 'home.subjects.kicker')}
            title={<span id="home-subjects-title">{t(messages, 'home.subjects.title')}</span>}
            description={t(messages, 'home.subjects.description')}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUBJECT_KEYS.map((key) => {
              const subject = getSubjectCopy(messages, key);
              const slug = t(messages, `subjects.list.${key}.slug`);
              return (
                <Card as="li" key={key} variant="muted" padding="md">
                  <Link
                    href={`/${locale}/matieres/${slug}`}
                    className="flex h-full flex-col gap-2 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
                  >
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {subject.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {subject.description}
                    </p>
                  </Link>
                </Card>
              );
            })}
          </ul>

          <p className="mt-8 text-center">
            <Link
              href={`/${locale}/matieres`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {t(messages, 'home.subjects.cta')}
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </Container>
      </section>

      {/* 5. How it works */}
      <section aria-labelledby="home-how-title">
        <Container width="lg" className="py-20">
          <SectionHeading
            kicker={t(messages, 'home.howItWorks.kicker')}
            title={<span id="home-how-title">{t(messages, 'home.howItWorks.title')}</span>}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEP_ITEMS.map((step, index) => (
              <li key={step.titleKey} className="relative pl-12">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                >
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold">{t(messages, step.titleKey)}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t(messages, step.descKey)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 6. Pricing teaser */}
      <section
        aria-labelledby="home-pricing-title"
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <SectionHeading
              kicker={t(messages, 'home.pricingTeaser.kicker')}
              title={
                <span id="home-pricing-title">
                  {t(messages, 'home.pricingTeaser.title')}
                </span>
              }
              description={t(messages, 'home.pricingTeaser.description')}
              align="center"
            />
            <Link href={`/${locale}/tarifs`} className="mt-2 inline-flex">
              <Button variant="primary" size="md">
                {t(messages, 'home.pricingTeaser.cta')}
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 7. Final CTA */}
      <section aria-labelledby="home-final-cta-title">
        <Container width="lg" className="py-20">
          <Card variant="accent" padding="lg" className="text-center">
            <h2
              id="home-final-cta-title"
              className="text-balance text-2xl font-bold sm:text-3xl"
            >
              {t(messages, 'home.finalCta.title')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-balance text-slate-700 dark:text-slate-200">
              {t(messages, 'home.finalCta.description')}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/${locale}/inscription`} className="inline-flex">
                <Button variant="primary" size="lg">
                  {t(messages, 'home.finalCta.ctaPrimary')}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} className="inline-flex">
                <Button variant="ghost" size="lg">
                  {t(messages, 'home.finalCta.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
