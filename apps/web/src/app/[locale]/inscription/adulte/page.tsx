import { getAuthEnv, isProviderConfigured } from '@eduquiz/auth/env';
import { getMessages, t } from '@eduquiz/i18n';
import { Button, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import { SignupAdultForm } from './SignupAdultForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 19 — Inscription apprenant adulte.
 *
 * Server Component qui :
 *   - rend la page (h1, intro, formulaire client)
 *   - lit la config OAuth (`getAuthEnv`) côté serveur pour décider si
 *     les boutons Google/Apple sont rendus
 *
 * Le formulaire lui-même est un Client Component (`SignupAdultForm`)
 * qui consomme la Server Action `registerAdult`.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.signup.adult.title'),
    description: t(messages, 'auth.signup.adult.subtitle'),
    alternates: {
      canonical: `/${locale}/inscription/adulte`,
      languages: { fr: '/fr/inscription/adulte', en: '/en/inscription/adulte' },
    },
    robots: { index: false, follow: false },
  };
}

export default function SignupAdultPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  // Lecture conditionnelle des providers OAuth — si rien n'est configuré,
  // on masque les boutons plutôt que de proposer un flux qui échouerait.
  let googleEnabled = false;
  let appleEnabled = false;
  try {
    const env = getAuthEnv();
    googleEnabled = isProviderConfigured(env, 'google');
    appleEnabled = isProviderConfigured(env, 'apple');
  } catch {
    // En dev sans AUTH_SECRET, on ne casse pas la page : pas d'OAuth visible.
  }

  // Construit le ReactNode du label CGU (substitution `{terms}` et
  // `{privacy}` par des liens). On reste server-side pour pouvoir
  // utiliser `<Link>`.
  const termsTemplate = t(messages, 'auth.signup.adult.termsLabel');
  const termsLabel = renderTermsLabel(
    termsTemplate,
    `/${locale}/conditions`,
    `/${locale}/confidentialite`,
    t(messages, 'auth.signup.adult.termsLink'),
    t(messages, 'auth.signup.adult.privacyLink'),
  );

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.signup.adult.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.signup.adult.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signup.adult.subtitle')}
        </p>

        <div className="mt-8">
          <SignupAdultForm
            locale={locale}
            copy={{
              emailLabel: t(messages, 'auth.signup.adult.emailLabel'),
              emailHint: t(messages, 'auth.signup.adult.emailHint'),
              passwordLabel: t(messages, 'auth.signup.adult.passwordLabel'),
              passwordHint: t(messages, 'auth.signup.adult.passwordHint'),
              birthDateLabel: t(messages, 'auth.signup.adult.birthDateLabel'),
              birthDateHint: t(messages, 'auth.signup.adult.birthDateHint'),
              termsLabel: termsLabel,
              marketingLabel: t(messages, 'auth.signup.adult.marketingLabel'),
              submit: t(messages, 'auth.signup.adult.submit'),
              submitting: t(messages, 'auth.signup.adult.submitting'),
              errors: {
                emailInvalid: t(messages, 'auth.signup.adult.errors.emailInvalid'),
                emailTaken: t(messages, 'auth.signup.adult.errors.emailTaken'),
                passwordTooShort: t(messages, 'auth.signup.adult.errors.passwordTooShort'),
                passwordWeak: t(messages, 'auth.signup.adult.errors.passwordWeak'),
                birthDateInvalid: t(messages, 'auth.signup.adult.errors.birthDateInvalid'),
                notAdult: t(messages, 'auth.signup.adult.errors.notAdult'),
                termsRequired: t(messages, 'auth.signup.adult.errors.termsRequired'),
                rateLimited: t(messages, 'auth.signup.adult.errors.rateLimited'),
                unknown: t(messages, 'auth.signup.adult.errors.unknown'),
              },
            }}
          />
        </div>

        {googleEnabled || appleEnabled ? (
          <div className="mt-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              {t(messages, 'auth.signup.adult.dividerOr')}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {googleEnabled ? (
                <Link
                  href="/api/auth/signin/google"
                  prefetch={false}
                  className="inline-flex"
                >
                  <Button variant="secondary" size="lg" fullWidth>
                    <span aria-hidden="true">G</span> {t(messages, 'auth.signup.adult.googleCta')}
                  </Button>
                </Link>
              ) : null}
              {appleEnabled ? (
                <Link
                  href="/api/auth/signin/apple"
                  prefetch={false}
                  className="inline-flex"
                >
                  <Button variant="secondary" size="lg" fullWidth>
                    <span aria-hidden="true"></span> {t(messages, 'auth.signup.adult.appleCta')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signup.adult.alreadyHaveAccount')}{' '}
          <Link
            href={`/${locale}/connexion`}
            className="font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            {t(messages, 'auth.signup.adult.signInCta')}
          </Link>
        </p>
      </div>
    </Container>
  );
}

/**
 * Substitution des placeholders `{terms}` / `{privacy}` par des liens.
 * Implémentation simple qui découpe la chaîne sur les deux marqueurs.
 */
function renderTermsLabel(
  template: string,
  termsHref: string,
  privacyHref: string,
  termsText: string,
  privacyText: string,
): JSX.Element {
  // On découpe sur les deux marqueurs en gardant l'ordre rencontré.
  const parts: ({ kind: 'text'; value: string } | { kind: 'terms' | 'privacy' })[] = [];
  const re = /\{(terms|privacy)\}/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > lastIndex) parts.push({ kind: 'text', value: template.slice(lastIndex, m.index) });
    parts.push({ kind: m[1] as 'terms' | 'privacy' });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < template.length) parts.push({ kind: 'text', value: template.slice(lastIndex) });

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.value}</span>;
        const href = p.kind === 'terms' ? termsHref : privacyHref;
        const label = p.kind === 'terms' ? termsText : privacyText;
        return (
          <Link
            key={i}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-700 underline hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
