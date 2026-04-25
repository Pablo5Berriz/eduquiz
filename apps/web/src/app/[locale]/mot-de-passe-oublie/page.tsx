import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import { ForgotPasswordForm } from './ForgotPasswordForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 17 — Mot de passe oublié.
 *
 * Server Component qui rend l'introduction et délègue la saisie email
 * + envoi du lien à `ForgotPasswordForm` (Client Component). La Server
 * Action retourne toujours `{ ok: true }` si l'email est bien formé
 * (anti-énumération) — l'envoi effectif est conditionné côté serveur.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.forgotPassword.title'),
    description: t(messages, 'auth.forgotPassword.subtitle'),
    robots: { index: false, follow: false },
  };
}

export default function ForgotPasswordPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.forgotPassword.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.forgotPassword.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.forgotPassword.subtitle')}
        </p>

        <div className="mt-8">
          <ForgotPasswordForm
            locale={locale}
            copy={{
              emailLabel: t(messages, 'auth.forgotPassword.emailLabel'),
              submit: t(messages, 'auth.forgotPassword.submit'),
              submitting: t(messages, 'auth.forgotPassword.submitting'),
              sentTitle: t(messages, 'auth.forgotPassword.sentTitle'),
              sentBody: t(messages, 'auth.forgotPassword.sentBody'),
              errors: {
                emailInvalid: t(messages, 'auth.forgotPassword.errors.emailInvalid'),
                unknown: t(messages, 'auth.forgotPassword.errors.unknown'),
              },
            }}
          />
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
          <Link
            href={`/${locale}/connexion`}
            className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            <span aria-hidden="true">←</span>
            {t(messages, 'auth.forgotPassword.backToSignIn')}
          </Link>
        </p>
      </div>
    </Container>
  );
}
