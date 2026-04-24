import { getMessages, t } from '@eduquiz/i18n';

import {
  LegalDocument,
  getRelatedLegalLinks,
} from '../../../components/layout/LegalDocument';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Politique de confidentialité » — écran 14 (sous-section 1/5).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'footer.privacy'),
    description: t(messages, 'legal.privacy.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/confidentialite`,
      languages: {
        fr: '/fr/confidentialite',
        en: '/en/confidentialite',
      },
    },
  };
}

export default function PrivacyPage({
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
      namespace="legal.privacy"
      relatedLinks={getRelatedLegalLinks('/confidentialite')}
    />
  );
}
