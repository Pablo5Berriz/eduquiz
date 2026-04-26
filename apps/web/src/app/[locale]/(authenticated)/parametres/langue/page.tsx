import { prisma } from '@eduquiz/db';
import { getMessages, t } from '@eduquiz/i18n';

import { requireAuthenticated } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import { LanguageForm } from './LanguageForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 33 — Paramètre langue (FR/EN). Persiste sur User.locale ET
 * Profile.preferredLocale via la Server Action `updateLocale`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.language.title'),
    robots: { index: false, follow: false },
  };
}

export default async function LanguageSettingsPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const user = await requireAuthenticated(locale, `/${locale}/parametres/langue`);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { locale: true },
  });
  const initial = (dbUser?.locale as 'FR' | 'EN') ?? 'FR';

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(messages, 'account.language.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.language.subtitle')}
      </p>

      <div className="mt-8">
        <LanguageForm
          initialLocale={initial}
          copy={{
            currentLabel: t(messages, 'account.language.currentLabel'),
            optionFr: t(messages, 'account.language.optionFr'),
            optionEn: t(messages, 'account.language.optionEn'),
            submit: t(messages, 'account.language.submit'),
            submitting: t(messages, 'account.language.submitting'),
            success: t(messages, 'account.language.success'),
          }}
        />
      </div>
    </div>
  );
}
