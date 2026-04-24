import { getMessages, t } from '@eduquiz/i18n';

import {
  LegalDocument,
  getRelatedLegalLinks,
} from '../../../components/layout/LegalDocument';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Politique de cookies » — écran 14 (sous-section 3/5).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'footer.cookies'),
    description: t(messages, 'legal.cookies.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/cookies`,
      languages: {
        fr: '/fr/cookies',
        en: '/en/cookies',
      },
    },
  };
}

export default function CookiesPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <LegalDocument
      locale={locale}
      messages={messages}
      namespace="legal.cookies"
      relatedLinks={getRelatedLegalLinks('/cookies')}
    />
  );
}
