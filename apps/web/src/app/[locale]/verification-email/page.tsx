import { getMessages, t, tf } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { maskEmail } from '../../../lib/auth/url';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import { ResendVerificationButton } from './ResendVerificationButton';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 22 — Vérification du courriel (page d'attente).
 *
 * Affiché juste après l'inscription. Le query string `?email=...` porte
 * l'email à afficher (en version masquée) et à utiliser pour le bouton
 * « Renvoyer ». L'email est lu côté serveur pour le rendu initial puis
 * passé au Client Component qui gère le cooldown.
 *
 * Si l'email est absent du query string, on rend quand même la page
 * mais sans le bouton (cas où l'utilisateur revient sur la page après
 * avoir fermé l'onglet).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.verifyEmail.pending.title'),
    description: t(messages, 'auth.verifyEmail.pending.body'),
    robots: { index: false, follow: false },
  };
}

export default function VerifyEmailPendingPage({
  params,
  searchParams,
}: {
  readonly params: LocaleRouteParams;
  readonly searchParams: { readonly email?: string };
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const email = (searchParams.email ?? '').trim().toLowerCase();
  const masked = email ? maskEmail(email) : '';

  return (
    <Container width="md" className="py-16 sm:py-20">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.verifyEmail.pending.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.verifyEmail.pending.title')}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {tf(messages, 'auth.verifyEmail.pending.body', { email: masked || '—' })}
        </p>

        {email ? (
          <ResendVerificationButton
            email={email}
            locale={locale}
            resendCta={t(messages, 'auth.verifyEmail.pending.resendCta')}
            resendCooldownTemplate={t(messages, 'auth.verifyEmail.pending.resendCooldown')}
            resendSuccess={t(messages, 'auth.verifyEmail.pending.resendSuccess')}
          />
        ) : null}

        <p className="text-sm">
          <Link
            href={`/${locale}/contact`}
            className="font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            {t(messages, 'auth.verifyEmail.pending.supportLink')}
          </Link>
        </p>
        <p className="text-xs">
          <Link
            href={`/${locale}`}
            className="text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t(messages, 'auth.verifyEmail.pending.signOut')}
          </Link>
        </p>
      </div>
    </Container>
  );
}
