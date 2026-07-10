import { getMessages, t } from '@eduquiz/i18n';

import { LegalDocument, getRelatedLegalLinks } from '../../../components/layout/LegalDocument';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Loi 25 » — écran 14 (sous-section 5/5).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'footer.loi25'),
    description: t(messages, 'legal.loi25.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/loi-25`,
      languages: {
        fr: '/fr/loi-25',
        en: '/en/loi-25',
      },
    },
  };
}

export default function Loi25Page({ params }: { readonly params: LocaleRouteParams }): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <LegalDocument
      locale={locale}
      messages={messages}
      namespace="legal.loi25"
      relatedLinks={getRelatedLegalLinks('/loi-25')}
    />
  );
}
