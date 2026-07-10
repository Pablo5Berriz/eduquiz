import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 15 — Sélecteur de type de compte.
 *
 * Affiche trois cartes (adulte, parent, mineur). Seul le compte adulte
 * est cliquable en V1 : parent (Lot 10) et mineur (Lot 11) arrivent dans
 * des lots ultérieurs. Les deux cartes sont visibles mais désactivées avec
 * un badge « Bientôt disponible » pour anticiper la demande sans créer
 * d'impasse : un mineur ne peut pas s'inscrire si son parent n'a pas encore
 * de compte PARENT, et le flux parent n'est pas encore livré.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'auth.accountTypePicker.title'),
    description: t(messages, 'auth.accountTypePicker.subtitle'),
    alternates: {
      canonical: `/${locale}/inscription`,
      languages: { fr: '/fr/inscription', en: '/en/inscription' },
    },
  };
}

export default function AccountTypePickerPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <Container width="md" className="py-16 sm:py-20">
      <p className="mb-2 text-sm">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
        >
          <span aria-hidden="true">←</span>
          {t(messages, 'auth.accountTypePicker.backToHome')}
        </Link>
      </p>

      <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {t(messages, 'auth.accountTypePicker.title')}
      </h1>
      <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-300">
        {t(messages, 'auth.accountTypePicker.subtitle')}
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Adulte — actif */}
        <li>
          <Link
            href={`/${locale}/inscription/adulte`}
            className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
          >
            <span aria-hidden="true" className="text-3xl">
              🧑
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t(messages, 'auth.accountTypePicker.optionAdult.title')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t(messages, 'auth.accountTypePicker.optionAdult.description')}
            </p>
            <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {t(messages, 'auth.accountTypePicker.optionAdult.cta')}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>

        {/* Parent — désactivé (Lot 10) */}
        <li>
          <div
            aria-disabled="true"
            className="relative flex h-full flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 opacity-75 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
              {t(messages, 'auth.accountTypePicker.optionParent.comingSoon')}
            </span>
            <span aria-hidden="true" className="text-3xl">
              👨‍👩‍👧
            </span>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {t(messages, 'auth.accountTypePicker.optionParent.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(messages, 'auth.accountTypePicker.optionParent.description')}
            </p>
          </div>
        </li>

        {/* Mineur — désactivé (Lot 11 — dépend du Lot 10 parent) */}
        <li>
          <div
            aria-disabled="true"
            className="relative flex h-full flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 opacity-75 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
              {t(messages, 'auth.accountTypePicker.optionMinor.comingSoon')}
            </span>
            <span aria-hidden="true" className="text-3xl">
              🧒
            </span>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {t(messages, 'auth.accountTypePicker.optionMinor.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(messages, 'auth.accountTypePicker.optionMinor.description')}
            </p>
          </div>
        </li>
      </ul>

      <p className="mt-10 text-center text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'auth.accountTypePicker.alreadyHaveAccount')}{' '}
        <Link
          href={`/${locale}/connexion`}
          className="font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
        >
          {t(messages, 'auth.accountTypePicker.signInCta')}
        </Link>
      </p>
    </Container>
  );
}
