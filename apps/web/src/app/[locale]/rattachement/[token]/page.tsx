import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { confirmParentLink } from '../../../../lib/family/actions';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page publique de confirmation du rattachement parent (Tâche 2.2).
 *
 * Le parent clique le lien reçu par courriel :
 *   `/{locale}/rattachement/{token}`
 *
 * Action serveur `confirmParentLink` consomme le token et passe le lien
 * en VERIFIED. Aucune authentification requise — le token 256-bit suffit.
 */

interface TokenRouteParams extends LocaleRouteParams {
  readonly token: string;
}

export function generateMetadata({ params }: { params: TokenRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'family.confirmLink.title'),
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmParentLinkPage({
  params,
}: {
  readonly params: TokenRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const result = await confirmParentLink(decodeURIComponent(params.token));

  if (result.ok) {
    return (
      <Container width="sm" className="py-20 sm:py-28">
        <div className="rounded-xl border border-success-200 bg-success-50 p-8 text-center shadow-sm dark:border-success-800 dark:bg-success-950/20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/40">
            <svg
              className="h-6 w-6 text-success-700 dark:text-success-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t(messages, 'family.confirmLink.title')}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t(messages, 'family.confirmLink.body')}
          </p>
          <Link
            href={`/${locale}/parent/enfants`}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
          >
            {t(messages, 'family.confirmLink.dashboardCta')} →
          </Link>
        </div>
      </Container>
    );
  }

  // Erreur : invalid ou expired.
  const isExpired = result.reason === 'expired';
  const title = isExpired
    ? t(messages, 'family.confirmLink.expiredTitle')
    : t(messages, 'family.confirmLink.invalidTitle');
  const body = isExpired
    ? t(messages, 'family.confirmLink.expiredBody')
    : t(messages, 'family.confirmLink.invalidBody');

  return (
    <Container width="sm" className="py-20 sm:py-28">
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-8 text-center shadow-sm dark:border-danger-800 dark:bg-danger-950/20">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/40">
          <svg
            className="h-6 w-6 text-danger-700 dark:text-danger-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {title}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{body}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          ← {t(messages, 'family.confirmLink.backCta')}
        </Link>
      </div>
    </Container>
  );
}
