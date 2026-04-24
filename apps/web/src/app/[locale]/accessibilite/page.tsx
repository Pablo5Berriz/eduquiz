import { getMessages, t } from '@eduquiz/i18n';

import {
  LegalDocument,
  getRelatedLegalLinks,
} from '../../../components/layout/LegalDocument';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Accessibilité » — écran 14 (sous-section 4/5).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'footer.accessibility'),
    description: t(messages, 'legal.accessibility.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/accessibilite`,
      languages: {
        fr: '/fr/accessibilite',
        en: '/en/accessibilite',
      },
    },
  };
}

export default function AccessibilityPage({
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
      namespace="legal.accessibility"
      relatedLinks={getRelatedLegalLinks('/accessibilite')}
    />
  );
}
