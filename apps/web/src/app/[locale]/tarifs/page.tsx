import { getMessages, t, tList, type Messages } from '@eduquiz/i18n';
import { Button, Card, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Tarifs » — écran 8.
 *
 * Trois plans affichés en grille 3 colonnes (empilés sur mobile). Le
 * plan central `Famille` porte une bordure accent et un badge « Le plus
 * populaire » pour orienter le regard. Un petit bloc FAQ (3 questions
 * tarifaires) referme la page, avec un lien vers la FAQ complète.
 */

interface PricingPlan {
  readonly id: string;
  readonly variant: 'surface' | 'accent';
  readonly nameKey: string;
  readonly priceKey: string;
  readonly periodKey: string;
  readonly descriptionKey: string;
  readonly bulletsKey: string;
  readonly ctaKey: string;
  readonly badgeKey?: string;
}

const PLANS: readonly PricingPlan[] = [
  {
    id: 'discovery',
    variant: 'surface',
    nameKey: 'pricing.plans.discoveryName',
    priceKey: 'pricing.plans.discoveryPrice',
    periodKey: 'pricing.plans.discoveryPeriod',
    descriptionKey: 'pricing.plans.discoveryDescription',
    bulletsKey: 'pricing.plans.discoveryBullets',
    ctaKey: 'pricing.plans.discoveryCta',
  },
  {
    id: 'family',
    variant: 'accent',
    nameKey: 'pricing.plans.familyName',
    priceKey: 'pricing.plans.familyPrice',
    periodKey: 'pricing.plans.familyPeriod',
    descriptionKey: 'pricing.plans.familyDescription',
    bulletsKey: 'pricing.plans.familyBullets',
    ctaKey: 'pricing.plans.familyCta',
    badgeKey: 'pricing.plans.familyBadge',
  },
  {
    id: 'familyPlus',
    variant: 'surface',
    nameKey: 'pricing.plans.familyPlusName',
    priceKey: 'pricing.plans.familyPlusPrice',
    periodKey: 'pricing.plans.familyPlusPeriod',
    descriptionKey: 'pricing.plans.familyPlusDescription',
    bulletsKey: 'pricing.plans.familyPlusBullets',
    ctaKey: 'pricing.plans.familyPlusCta',
  },
];

const FAQ_ITEMS = [
  { q: 'pricing.faq.q1', a: 'pricing.faq.a1' },
  { q: 'pricing.faq.q2', a: 'pricing.faq.a2' },
  { q: 'pricing.faq.q3', a: 'pricing.faq.a3' },
] as const;

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.pricing'),
    description: t(messages, 'pricing.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/tarifs`,
      languages: {
        fr: '/fr/tarifs',
        en: '/en/tarifs',
      },
    },
  };
}

function PlanCard({
  plan,
  locale,
  messages,
}: {
  plan: PricingPlan;
  locale: string;
  messages: Messages;
}): JSX.Element {
  const bullets = tList(messages, plan.bulletsKey);
  return (
    <Card
      as="li"
      variant={plan.variant}
      padding="lg"
      className="flex h-full flex-col"
      aria-labelledby={`plan-${plan.id}-name`}
    >
      {plan.badgeKey ? (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
          {t(messages, plan.badgeKey)}
        </span>
      ) : null}

      <h2
        id={`plan-${plan.id}-name`}
        className="text-lg font-semibold text-slate-900 dark:text-slate-100"
      >
        {t(messages, plan.nameKey)}
      </h2>

      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{t(messages, plan.priceKey)}</span>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {t(messages, plan.periodKey)}
        </span>
      </p>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, plan.descriptionKey)}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
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

      <div className="mt-8">
        <Link href={`/${locale}/inscription`} className="inline-flex w-full">
          <Button
            variant={plan.variant === 'accent' ? 'primary' : 'secondary'}
            size="md"
            className="w-full"
          >
            {t(messages, plan.ctaKey)}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function PricingPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'pricing.heroKicker')}
        title={t(messages, 'pricing.heroTitle')}
        subtitle={t(messages, 'pricing.heroSubtitle')}
      />

      <Container width="lg" className="py-16">
        <ul className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} locale={locale} messages={messages} />
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          {t(messages, 'pricing.note')}
        </p>
      </Container>

      <section aria-labelledby="pricing-faq-title" className="bg-slate-50 dark:bg-slate-900/40">
        <Container width="lg" className="py-16">
          <SectionHeading
            title={<span id="pricing-faq-title">{t(messages, 'pricing.faqTitle')}</span>}
            className="mx-auto max-w-3xl"
            align="center"
          />

          <dl className="mx-auto mt-10 flex max-w-3xl flex-col gap-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="border-l-2 border-brand-500 pl-4">
                <dt className="text-base font-semibold">{t(messages, item.q)}</dt>
                <dd className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t(messages, item.a)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-center">
            <Link
              href={`/${locale}/faq`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {t(messages, 'pricing.faqLinkLabel')}
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
