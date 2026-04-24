import { getMessages, t, tList, type Messages } from '@eduquiz/i18n';
import { Button, Card, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Fonctionnalités » — écran 2 de la vitrine publique.
 *
 * Quatre piliers affichés en cartes alternées (zigzag) : Quiz adaptatif,
 * Parcours par matière, Suivi de progression, Sécurité et
 * confidentialité. Chaque pilier liste trois points clés issus du
 * dictionnaire. Le bloc de fin pousse vers l'inscription ou les tarifs.
 */

interface Pillar {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly bulletsKey: string;
}

const PILLARS: readonly Pillar[] = [
  {
    id: 'quiz',
    titleKey: 'features.pillars.quizTitle',
    descriptionKey: 'features.pillars.quizDescription',
    bulletsKey: 'features.pillars.quizBullets',
  },
  {
    id: 'pathway',
    titleKey: 'features.pillars.pathwayTitle',
    descriptionKey: 'features.pillars.pathwayDescription',
    bulletsKey: 'features.pillars.pathwayBullets',
  },
  {
    id: 'progress',
    titleKey: 'features.pillars.progressTitle',
    descriptionKey: 'features.pillars.progressDescription',
    bulletsKey: 'features.pillars.progressBullets',
  },
  {
    id: 'privacy',
    titleKey: 'features.pillars.privacyTitle',
    descriptionKey: 'features.pillars.privacyDescription',
    bulletsKey: 'features.pillars.privacyBullets',
  },
];

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.features'),
    description: t(messages, 'features.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/fonctionnalites`,
      languages: {
        fr: '/fr/fonctionnalites',
        en: '/en/fonctionnalites',
      },
    },
  };
}

function PillarBullets({
  messages,
  bulletsKey,
}: {
  messages: Messages;
  bulletsKey: string;
}): JSX.Element {
  const bullets = tList(messages, bulletsKey);
  return (
    <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
      {bullets.map((bullet) => (
        <li key={bullet} className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
          />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FeaturesPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'features.heroKicker')}
        title={t(messages, 'features.heroTitle')}
        subtitle={t(messages, 'features.heroSubtitle')}
      />

      <Container width="lg" className="py-20">
        <ol className="flex flex-col gap-10">
          {PILLARS.map((pillar, index) => (
            <li
              key={pillar.id}
              id={pillar.id}
              className="scroll-mt-24"
              aria-labelledby={`pillar-${pillar.id}-title`}
            >
              <Card variant="surface" padding="lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h2
                      id={`pillar-${pillar.id}-title`}
                      className="text-xl font-semibold sm:text-2xl"
                    >
                      {t(messages, pillar.titleKey)}
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      {t(messages, pillar.descriptionKey)}
                    </p>
                    <PillarBullets messages={messages} bulletsKey={pillar.bulletsKey} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Container>

      <section
        aria-labelledby="features-final-cta-title"
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h2
              id="features-final-cta-title"
              className="text-balance text-2xl font-bold sm:text-3xl"
            >
              {t(messages, 'features.finalCtaTitle')}
            </h2>
            <p className="text-balance text-slate-600 dark:text-slate-300">
              {t(messages, 'features.finalCtaDescription')}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/inscription`} className="inline-flex">
                <Button variant="primary" size="lg">
                  {t(messages, 'features.finalCtaPrimary')}
                </Button>
              </Link>
              <Link href={`/${locale}/tarifs`} className="inline-flex">
                <Button variant="secondary" size="lg">
                  {t(messages, 'features.finalCtaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
