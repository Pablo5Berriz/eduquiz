import { prisma } from '@eduquiz/db';
import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';

import { requireAuthenticated } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import { EditProfileForm } from './EditProfileForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 30 — Édition de profil.
 *
 * Server Component qui charge le profil courant depuis Prisma puis
 * délègue le formulaire au Client Component `EditProfileForm`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.editProfile.title'),
    robots: { index: false, follow: false },
  };
}

export default async function EditProfilePage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const user = await requireAuthenticated(locale, `/${locale}/profil/modifier`);

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      currentGrade: true,
      preferredLocale: true,
      avatarUrl: true,
    },
  });

  return (
    <Container width="md" className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          {t(messages, 'account.editProfile.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t(messages, 'account.editProfile.subtitle')}
        </p>

        <div className="mt-8">
          <EditProfileForm
            locale={locale}
            initial={{
              firstName: profile?.firstName ?? '',
              lastName: profile?.lastName ?? '',
              displayName: profile?.displayName ?? '',
              currentGrade: profile?.currentGrade ?? '',
              preferredLocale: (profile?.preferredLocale as 'FR' | 'EN') ?? 'FR',
              avatarUrl: profile?.avatarUrl ?? '',
            }}
            copy={{
              fields: {
                firstName: t(messages, 'account.profile.fields.firstName'),
                lastName: t(messages, 'account.profile.fields.lastName'),
                displayName: t(messages, 'account.profile.fields.displayName'),
                currentGrade: t(messages, 'account.profile.fields.currentGrade'),
                preferredLocale: t(messages, 'account.profile.fields.preferredLocale'),
                avatarUrl: t(messages, 'account.profile.fields.avatarUrl'),
                firstNameHint: t(messages, 'account.editProfile.fields.firstNameHint'),
                lastNameHint: t(messages, 'account.editProfile.fields.lastNameHint'),
                displayNameHint: t(messages, 'account.editProfile.fields.displayNameHint'),
                currentGradeHint: t(messages, 'account.editProfile.fields.currentGradeHint'),
                preferredLocaleHint: t(messages, 'account.editProfile.fields.preferredLocaleHint'),
                avatarUrlHint: t(messages, 'account.editProfile.fields.avatarUrlHint'),
              },
              localeOptions: {
                fr: t(messages, 'account.language.optionFr'),
                en: t(messages, 'account.language.optionEn'),
              },
              submit: t(messages, 'account.editProfile.submit'),
              submitting: t(messages, 'account.editProfile.submitting'),
              cancel: t(messages, 'account.editProfile.cancel'),
              success: t(messages, 'account.editProfile.success'),
              errors: {
                firstNameTooLong: t(messages, 'account.editProfile.errors.firstNameTooLong'),
                lastNameTooLong: t(messages, 'account.editProfile.errors.lastNameTooLong'),
                displayNameTooLong: t(messages, 'account.editProfile.errors.displayNameTooLong'),
                avatarUrlInvalid: t(messages, 'account.editProfile.errors.avatarUrlInvalid'),
                gradeInvalid: t(messages, 'account.editProfile.errors.gradeInvalid'),
                localeInvalid: t(messages, 'account.editProfile.errors.localeInvalid'),
                unknown: t(messages, 'account.editProfile.errors.unknown'),
              },
            }}
          />
        </div>
      </div>
    </Container>
  );
}
