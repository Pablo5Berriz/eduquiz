import { getMessages, t } from '@eduquiz/i18n';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import { ChangePasswordForm } from './ChangePasswordForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 32 — Paramètres du compte (V1 = changement de mot de passe).
 *
 * Le changement d'email est reporté à un lot dédié (re-vérification,
 * période transitoire, anti-takeover). Cet écran ne couvre que le
 * mot de passe en V1.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.changePassword.title'),
    robots: { index: false, follow: false },
  };
}

export default function AccountSettingsPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(messages, 'account.changePassword.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.changePassword.subtitle')}
      </p>

      <div className="mt-8">
        <ChangePasswordForm
          locale={locale}
          copy={{
            currentLabel: t(messages, 'account.changePassword.currentLabel'),
            newLabel: t(messages, 'account.changePassword.newLabel'),
            newHint: t(messages, 'account.changePassword.newHint'),
            confirmLabel: t(messages, 'account.changePassword.confirmLabel'),
            submit: t(messages, 'account.changePassword.submit'),
            submitting: t(messages, 'account.changePassword.submitting'),
            success: t(messages, 'account.changePassword.success'),
            errors: {
              currentRequired: t(messages, 'account.changePassword.errors.currentRequired'),
              currentInvalid: t(messages, 'account.changePassword.errors.currentInvalid'),
              newTooShort: t(messages, 'account.changePassword.errors.newTooShort'),
              newWeak: t(messages, 'account.changePassword.errors.newWeak'),
              newSameAsOld: t(messages, 'account.changePassword.errors.newSameAsOld'),
              mismatch: t(messages, 'account.changePassword.errors.mismatch'),
              unknown: t(messages, 'account.changePassword.errors.unknown'),
            },
          }}
        />
      </div>
    </div>
  );
}
