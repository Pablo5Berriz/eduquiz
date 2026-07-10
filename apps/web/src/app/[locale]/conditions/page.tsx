import { getMessages, t } from '@eduquiz/i18n';

import { LegalDocument, getRelatedLegalLinks } from '../../../components/layout/LegalDocument';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Conditions d'utilisation » — écran 14 (sous-section 2/5).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'footer.terms'),
    description: t(messages, 'legal.terms.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/conditions`,
      languages: {
        fr: '/fr/conditions',
        en: '/en/conditions',
      },
    },
  };
}

export default function TermsPage({ params }: { readonly params: LocaleRouteParams }): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <LegalDocument
      locale={locale}
      messages={messages}
      namespace="legal.terms"
      relatedLinks={getRelatedLegalLinks('/conditions')}
    />
  );
}
