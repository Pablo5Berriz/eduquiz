import { getMessages, t } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « À propos » — écran 9.
 *
 * Trois blocs : Mission, Valeurs (3 cartes), Équipe, suivi d'un CTA
 * final vers Contact / Fonctionnalités. Le contenu est entièrement
 * piloté par le dictionnaire `about.*`.
 */

interface Value {
  readonly titleKey: string;
  readonly descriptionKey: string;
}

const VALUES: readonly Value[] = [
  { titleKey: 'about.value1Title', descriptionKey: 'about.value1Description' },
  { titleKey: 'about.value2Title', descriptionKey: 'about.value2Description' },
  { titleKey: 'about.value3Title', descriptionKey: 'about.value3Description' },
];

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.about'),
    description: t(messages, 'about.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/a-propos`,
      languages: {
        fr: '/fr/a-propos',
        en: '/en/a-propos',
      },
    },
  };
}

export default function AboutPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'about.heroKicker')}
        title={t(messages, 'about.heroTitle')}
        subtitle={t(messages, 'about.heroSubtitle')}
      />

      <Container width="lg" className="py-16">
        <section aria-labelledby="about-mission-title" className="mx-auto max-w-3xl text-center">
          <SectionHeading
            title={<span id="about-mission-title">{t(messages, 'about.missionTitle')}</span>}
            align="center"
          />
          <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
            {t(messages, 'about.missionDescription')}
          </p>
        </section>

        <section aria-labelledby="about-values-title" className="mt-20">
          <SectionHeading
            title={<span id="about-values-title">{t(messages, 'about.valuesTitle')}</span>}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <Card as="li" key={value.titleKey} variant="surface" padding="lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t(messages, value.titleKey)}
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {t(messages, value.descriptionKey)}
                </p>
              </Card>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-team-title" className="mt-20 mx-auto max-w-3xl text-center">
          <SectionHeading
            title={<span id="about-team-title">{t(messages, 'about.teamTitle')}</span>}
            align="center"
          />
          <p className="mt-4 text-base text-slate-700 dark:text-slate-200">
            {t(messages, 'about.teamDescription')}
          </p>
        </section>
      </Container>

      <section
        aria-labelledby="about-cta-title"
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h2
              id="about-cta-title"
              className="text-balance text-2xl font-bold sm:text-3xl"
            >
              {t(messages, 'about.ctaTitle')}
            </h2>
            <p className="text-balance text-slate-600 dark:text-slate-300">
              {t(messages, 'about.ctaDescription')}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/contact`} className="inline-flex">
                <Button variant="primary" size="lg">
                  {t(messages, 'about.ctaPrimary')}
                </Button>
              </Link>
              <Link href={`/${locale}/fonctionnalites`} className="inline-flex">
                <Button variant="secondary" size="lg">
                  {t(messages, 'about.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
