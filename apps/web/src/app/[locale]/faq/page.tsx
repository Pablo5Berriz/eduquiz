import { getMessages, t } from '@eduquiz/i18n';
import { Button, Container, SectionHeading } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « FAQ » — écran 11.
 *
 * Questions fréquentes affichées en `<details>`/`<summary>` natifs :
 * accessibilité clavier gratuite, aucun JS requis, et rendu correct côté
 * SSR. Le bloc CTA final invite à écrire à l'équipe support.
 */

interface FaqItem {
  readonly id: string;
  readonly qKey: string;
  readonly aKey: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  { id: 'q1', qKey: 'faq.items.q1', aKey: 'faq.items.a1' },
  { id: 'q2', qKey: 'faq.items.q2', aKey: 'faq.items.a2' },
  { id: 'q3', qKey: 'faq.items.q3', aKey: 'faq.items.a3' },
  { id: 'q4', qKey: 'faq.items.q4', aKey: 'faq.items.a4' },
  { id: 'q5', qKey: 'faq.items.q5', aKey: 'faq.items.a5' },
  { id: 'q6', qKey: 'faq.items.q6', aKey: 'faq.items.a6' },
];

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.faq'),
    description: t(messages, 'faq.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/faq`,
      languages: {
        fr: '/fr/faq',
        en: '/en/faq',
      },
    },
  };
}

export default function FaqPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'faq.heroKicker')}
        title={t(messages, 'faq.heroTitle')}
        subtitle={t(messages, 'faq.heroSubtitle')}
      />

      <Container width="md" className="py-16">
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {FAQ_ITEMS.map((item) => (
            <li key={item.id}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-100">
                  <span>{t(messages, item.qKey)}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-brand-600 transition-transform group-open:rotate-45 dark:text-brand-400"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                  {t(messages, item.aKey)}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </Container>

      <section
        aria-labelledby="faq-cta-title"
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <SectionHeading
              title={<span id="faq-cta-title">{t(messages, 'faq.ctaTitle')}</span>}
              align="center"
            />
            <p className="text-balance text-slate-600 dark:text-slate-300">
              {t(messages, 'faq.ctaDescription')}
            </p>
            <Link href={`/${locale}/contact`} className="inline-flex">
              <Button variant="primary" size="lg">
                {t(messages, 'faq.ctaLabel')}
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
