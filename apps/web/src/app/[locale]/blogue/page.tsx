import { getMessages, t } from '@eduquiz/i18n';
import { Button, Card, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Blogue » — écran 12 (placeholder).
 *
 * Le blogue ouvre avec la V1 : tant qu'il n'y a pas d'articles, on
 * montre un état vide soigné avec CTA de repli vers l'accueil. Le slug
 * `/blogue` est conservé en FR et en EN pour cohérence URL.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.blog'),
    description: t(messages, 'blog.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/blogue`,
      languages: {
        fr: '/fr/blogue',
        en: '/en/blogue',
      },
    },
  };
}

export default function BlogPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <>
      <PageHero
        kicker={t(messages, 'blog.heroKicker')}
        title={t(messages, 'blog.heroTitle')}
        subtitle={t(messages, 'blog.heroSubtitle')}
      />

      <Container width="md" className="py-16">
        <Card variant="muted" padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t(messages, 'blog.emptyTitle')}
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t(messages, 'blog.emptyDescription')}
          </p>
          <div className="mt-6">
            <Link href={`/${locale}`} className="inline-flex">
              <Button variant="secondary" size="md">
                {t(messages, 'blog.cta')}
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </>
  );
}
