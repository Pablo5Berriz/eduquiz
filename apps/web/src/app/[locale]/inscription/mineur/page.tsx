import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import { SignupMinorForm } from './SignupMinorForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran — Inscription élève mineur.
 *
 * Même structure que `SignupAdultPage`. Pas de boutons OAuth (les
 * mineurs n'ont pas encore de flux OAuth configuré en V1).
 *
 * Après soumission réussie, `SignupMinorForm` redirige vers
 * `/verification-email`. Le rattachement parent est géré séparément.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.signup.minor.title'),
    description: t(messages, 'auth.signup.minor.subtitle'),
    alternates: {
      canonical: `/${locale}/inscription/mineur`,
      languages: { fr: '/fr/inscription/mineur', en: '/en/inscription/mineur' },
    },
    robots: { index: false, follow: false },
  };
}

export default function SignupMinorPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const termsTemplate = t(messages, 'auth.signup.minor.termsLabel');
  const termsLabel = renderTermsLabel(
    termsTemplate,
    `/${locale}/conditions`,
    `/${locale}/confidentialite`,
    t(messages, 'auth.signup.minor.termsLink'),
    t(messages, 'auth.signup.minor.privacyLink'),
  );

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {t(messages, 'auth.signup.minor.heroKicker')}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t(messages, 'auth.signup.minor.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signup.minor.subtitle')}
        </p>

        <div className="mt-8">
          <SignupMinorForm
            locale={locale}
            copy={{
              emailLabel: t(messages, 'auth.signup.minor.emailLabel'),
              emailHint: t(messages, 'auth.signup.minor.emailHint'),
              passwordLabel: t(messages, 'auth.signup.minor.passwordLabel'),
              passwordHint: t(messages, 'auth.signup.minor.passwordHint'),
              birthDateLabel: t(messages, 'auth.signup.minor.birthDateLabel'),
              birthDateHint: t(messages, 'auth.signup.minor.birthDateHint'),
              termsLabel,
              submit: t(messages, 'auth.signup.minor.submit'),
              submitting: t(messages, 'auth.signup.minor.submitting'),
              errors: {
                emailInvalid: t(messages, 'auth.signup.minor.errors.emailInvalid'),
                emailTaken: t(messages, 'auth.signup.minor.errors.emailTaken'),
                passwordTooShort: t(messages, 'auth.signup.minor.errors.passwordTooShort'),
                passwordWeak: t(messages, 'auth.signup.minor.errors.passwordWeak'),
                birthDateInvalid: t(messages, 'auth.signup.minor.errors.birthDateInvalid'),
                notMinor: t(messages, 'auth.signup.minor.errors.notMinor'),
                tooYoung: t(messages, 'auth.signup.minor.errors.tooYoung'),
                termsRequired: t(messages, 'auth.signup.minor.errors.termsRequired'),
                unknown: t(messages, 'auth.signup.minor.errors.unknown'),
                rateLimited: t(messages, 'auth.signup.minor.errors.rateLimited'),
              },
            }}
          />
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
          {t(messages, 'auth.signup.minor.alreadyHaveAccount')}{' '}
          <Link
            href={`/${locale}/connexion`}
            className="font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
          >
            {t(messages, 'auth.signup.minor.signInCta')}
          </Link>
        </p>
      </div>
    </Container>
  );
}

/**
 * Substitution des placeholders `{terms}` / `{privacy}` par des liens.
 * Dupliqué depuis `SignupAdultPage` — à extraire dans un helper partagé
 * si un troisième formulaire en a besoin.
 */
function renderTermsLabel(
  template: string,
  termsHref: string,
  privacyHref: string,
  termsText: string,
  privacyText: string,
): JSX.Element {
  const parts: ({ kind: 'text'; value: string } | { kind: 'terms' | 'privacy' })[] = [];
  const re = /\{(terms|privacy)\}/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > lastIndex)
      parts.push({ kind: 'text', value: template.slice(lastIndex, m.index) });
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
