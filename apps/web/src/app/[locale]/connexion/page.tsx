import { getAuthEnv, isProviderConfigured } from '@eduquiz/auth/env';
import { getMessages, t } from '@eduquiz/i18n';
import { Alert, Button, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import { SignInForm } from './SignInForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 16 — Connexion.
 *
 * Server Component qui :
 *   - rend la page (h1, intro, formulaire client, OAuth si configuré)
 *   - lit le query string pour afficher les bannières contextuelles :
 *     `?verified=1` (post-vérification email), `?reset=1` (post-reset
 *     password), `?session=expired` (révocation), `?next=...` (URL de
 *     retour préservée pour la Server Action).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.signin.title'),
    description: t(messages, 'auth.signin.subtitle'),
    alternates: {
      canonical: `/${locale}/connexion`,
      languages: { fr: '/fr/connexion', en: '/en/connexion' },
    },
    robots: { index: false, follow: false },
  };
}

interface SearchParams {
  readonly verified?: string;
  readonly reset?: string;
  readonly session?: string;
  readonly next?: string;
}

export default function SignInPage({
  params,
  searchParams,
}: {
  readonly params: LocaleRouteParams;
  readonly searchParams: SearchParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  let googleEnabled = false;
  let appleEnabled = false;
  try {
    const env = getAuthEnv();
    googleEnabled = isProviderConfigured(env, 'google');
    appleEnabled = isProviderConfigured(env, 'apple');
  } catch {
    // En dev sans AUTH_SECRET, on ne casse pas la page.
  }

  // Sécurise le `next` côté serveur : on garde uniquement les chemins
  // relatifs commençant par `/`.
  const rawNext = searchParams.next;
  const nextPath = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.signin.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.signin.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signin.subtitle')}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {searchParams.verified === '1' ? (
            <Alert tone="success">{t(messages, 'auth.signin.alerts.verified')}</Alert>
          ) : null}
          {searchParams.reset === '1' ? (
            <Alert tone="success">{t(messages, 'auth.signin.alerts.reset')}</Alert>
          ) : null}
          {searchParams.session === 'expired' ? (
            <Alert tone="warning">{t(messages, 'auth.signin.alerts.sessionExpired')}</Alert>
          ) : null}
        </div>

        <div className="mt-6">
          <SignInForm
            locale={locale}
            nextPath={nextPath}
            copy={{
              emailLabel: t(messages, 'auth.signin.emailLabel'),
              passwordLabel: t(messages, 'auth.signin.passwordLabel'),
              forgotPassword: t(messages, 'auth.signin.forgotPassword'),
              submit: t(messages, 'auth.signin.submit'),
              submitting: t(messages, 'auth.signin.submitting'),
              errors: {
                invalidCredentials: t(messages, 'auth.signin.errors.invalidCredentials'),
                accountDisabled: t(messages, 'auth.signin.errors.accountDisabled'),
                unverified: t(messages, 'auth.signin.errors.unverified'),
                rateLimited: t(messages, 'auth.signin.errors.rateLimited'),
                unknown: t(messages, 'auth.signin.errors.unknown'),
              },
            }}
          />
        </div>

        {googleEnabled || appleEnabled ? (
          <div className="mt-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              {t(messages, 'auth.signin.dividerOr')}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {googleEnabled ? (
                <Link href="/api/auth/signin/google" prefetch={false} className="inline-flex">
                  <Button variant="secondary" size="lg" fullWidth>
                    <span aria-hidden="true">G</span> {t(messages, 'auth.signin.googleCta')}
                  </Button>
                </Link>
              ) : null}
              {appleEnabled ? (
                <Link href="/api/auth/signin/apple" prefetch={false} className="inline-flex">
                  <Button variant="secondary" size="lg" fullWidth>
                    <span aria-hidden="true"></span> {t(messages, 'auth.signin.appleCta')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signin.noAccount')}{' '}
          <Link
            href={`/${locale}/inscription`}
            className="font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            {t(messages, 'auth.signin.signupCta')}
          </Link>
        </p>
      </div>
    </Container>
  );
}
