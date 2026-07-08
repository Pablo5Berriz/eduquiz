import { peekToken } from '@eduquiz/auth/tokens';
import { getMessages, t } from '@eduquiz/i18n';
import { Button, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam } from '../../../../../lib/i18n/locale';

import { ResetPasswordForm } from './ResetPasswordForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 18 — Réinitialisation de mot de passe.
 *
 * Server Component qui :
 *   - inspecte le token via `peekToken` (sans le consommer) pour
 *     décider quel UI rendre : formulaire (token valide), message
 *     « expiré » ou « invalide »
 *   - délègue la soumission au Client Component `ResetPasswordForm` qui
 *     consommera le token via la Server Action `completePasswordReset`
 *
 * **Force le runtime Node** : `peekToken` touche à Prisma.
 */

interface ResetRouteParams {
  readonly locale: string;
  readonly token: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: ResetRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.resetPassword.title'),
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  readonly params: ResetRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const token = decodeURIComponent(params.token);

  const peeked = await peekToken(token);
  // `peekToken` retourne null si inconnu OU expiré. Pour distinguer
  // les deux, on tente une seconde lecture du raw — coût négligeable
  // (clé unique) et permet un message plus précis.
  // En pratique, un token inexistant et un token expiré donnent tous
  // deux `null`. On distingue donc seulement « pas valid pour reset »
  // (autre purpose) du cas « inconnu/expiré ». On affiche un message
  // « invalide » dans tous les cas — l'utilisateur peut alors demander
  // un nouveau lien.
  const validForReset = peeked?.purpose === 'reset-password';

  if (!validForReset) {
    return (
      <Container width="md" className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <span aria-hidden="true" className="text-5xl">
            ⚠️
          </span>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t(messages, 'auth.resetPassword.invalid.title')}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {t(messages, 'auth.resetPassword.invalid.body')}
          </p>
          <Link href={`/${locale}/mot-de-passe-oublie`} className="inline-flex">
            <Button variant="primary" size="lg">
              {t(messages, 'auth.resetPassword.invalid.requestCta')}
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.resetPassword.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.resetPassword.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.resetPassword.subtitle')}
        </p>

        <div className="mt-8">
          <ResetPasswordForm
            locale={locale}
            token={token}
            copy={{
              newPasswordLabel: t(messages, 'auth.resetPassword.newPasswordLabel'),
              newPasswordHint: t(messages, 'auth.resetPassword.newPasswordHint'),
              confirmPasswordLabel: t(messages, 'auth.resetPassword.confirmPasswordLabel'),
              submit: t(messages, 'auth.resetPassword.submit'),
              submitting: t(messages, 'auth.resetPassword.submitting'),
              successTitle: t(messages, 'auth.resetPassword.success.title'),
              successBody: t(messages, 'auth.resetPassword.success.body'),
              successCta: t(messages, 'auth.resetPassword.success.signInCta'),
              errors: {
                passwordTooShort: t(messages, 'auth.resetPassword.errors.passwordTooShort'),
                passwordWeak: t(messages, 'auth.resetPassword.errors.passwordWeak'),
                passwordMismatch: t(messages, 'auth.resetPassword.errors.passwordMismatch'),
                tokenExpired: t(messages, 'auth.resetPassword.errors.tokenExpired'),
                tokenInvalid: t(messages, 'auth.resetPassword.errors.tokenInvalid'),
                rateLimited: t(messages, 'auth.resetPassword.errors.rateLimited'),
                unknown: t(messages, 'auth.resetPassword.errors.unknown'),
              },
            }}
          />
        </div>
      </div>
    </Container>
  );
}
