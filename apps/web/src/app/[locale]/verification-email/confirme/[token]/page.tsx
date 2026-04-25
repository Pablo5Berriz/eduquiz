import { getMessages, t } from '@eduquiz/i18n';
import { Button, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { confirmVerification } from '../../../../../lib/auth/actions/verify-email';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 23 — Confirmation du lien email.
 *
 * Atterrit ici quand l'utilisateur clique sur le lien reçu. La Server
 * Action `confirmVerification` consomme le token et marque l'email
 * vérifié. On rend trois états possibles (succès / lien expiré / lien
 * invalide), tous bilingues.
 *
 * **Force le runtime Node** : `confirmVerification` touche à Prisma.
 */

interface TokenRouteParams {
  readonly locale: string;
  readonly token: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: TokenRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.verifyEmail.confirmed.title'),
    robots: { index: false, follow: false },
  };
}

export default async function VerifyEmailConfirmPage({
  params,
}: {
  readonly params: TokenRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const result = await confirmVerification(decodeURIComponent(params.token));

  if (result.ok) {
    return (
      <Container width="md" className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <span aria-hidden="true" className="text-5xl">
            ✅
          </span>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t(messages, 'auth.verifyEmail.confirmed.title')}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {t(messages, 'auth.verifyEmail.confirmed.body')}
          </p>
          <Link href={`/${locale}/connexion?verified=1`} className="inline-flex">
            <Button variant="primary" size="lg">
              {t(messages, 'auth.verifyEmail.confirmed.signInCta')}
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // Erreur — distingue lien expiré et invalide.
  const branch = result.reason === 'expired' ? 'expired' : 'invalid';
  return (
    <Container width="md" className="py-16 sm:py-20">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <span aria-hidden="true" className="text-5xl">
          ⚠️
        </span>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, `auth.verifyEmail.${branch}.title`)}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {t(messages, `auth.verifyEmail.${branch}.body`)}
        </p>
        <Link href={`/${locale}/connexion`} className="inline-flex">
          <Button variant="primary" size="lg">
            {t(messages, `auth.verifyEmail.${branch}.signInCta`)}
          </Button>
        </Link>
      </div>
    </Container>
  );
}
