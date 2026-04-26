import { getMessages, t } from '@eduquiz/i18n';
import { Card } from '@eduquiz/ui';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import { DeleteAccountForm } from './DeleteAccountForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 38 — Suppression du compte (soft delete avec délai de grâce
 * de 30 jours). Marque User.disabledAt + crée DataRequest type=DELETION.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.deletion.title'),
    robots: { index: false, follow: false },
  };
}

export default function DeleteAccountPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-danger-700 sm:text-3xl dark:text-danger-300">
        ⚠ {t(messages, 'account.deletion.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.deletion.subtitle')}
      </p>

      <Card variant="muted" padding="lg" className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t(messages, 'account.deletion.includes.heading')}
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-200">
          {(['profile', 'progress', 'badges'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-danger-500" />
              <span>{t(messages, `account.deletion.includes.${k}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t(messages, 'account.deletion.legalNote')}
        </p>
      </Card>

      <div className="mt-8">
        <DeleteAccountForm
          locale={locale}
          copy={{
            passwordLabel: t(messages, 'account.deletion.passwordLabel'),
            confirmInstruction: t(messages, 'account.deletion.confirmInstruction'),
            confirmWord: t(messages, 'account.deletion.confirmWord'),
            confirmPlaceholder: t(messages, 'account.deletion.confirmPlaceholder'),
            submit: t(messages, 'account.deletion.submit'),
            submitting: t(messages, 'account.deletion.submitting'),
            cancel: t(messages, 'account.deletion.cancel'),
            success: t(messages, 'account.deletion.success'),
            errors: {
              passwordRequired: t(messages, 'account.deletion.errors.passwordRequired'),
              passwordInvalid: t(messages, 'account.deletion.errors.passwordInvalid'),
              mustTypeWord: t(messages, 'account.deletion.errors.mustTypeWord'),
              unknown: t(messages, 'account.deletion.errors.unknown'),
            },
          }}
        />
      </div>
    </div>
  );
}
