import { prisma } from '@eduquiz/db';
import { getMessages, t } from '@eduquiz/i18n';
import { Avatar, Button, Card, Container } from '@eduquiz/ui';
import Link from 'next/link';

import { requireAuthenticated } from '../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 29 — Profil utilisateur (vue lecture seule).
 *
 * Affiche les informations du Profile + email/locale du User. Bouton
 * « Modifier » qui mène à `/[locale]/profil/modifier`.
 *
 * Force le runtime Node (lecture Prisma).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.profile.title'),
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const user = await requireAuthenticated(locale, `/${locale}/profil`);

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

  const noValue = t(messages, 'account.profile.fields.noValue');
  const displayName =
    profile?.displayName && profile.displayName.length > 0
      ? profile.displayName
      : profile?.firstName ?? user.email.split('@')[0]!;

  return (
    <Container width="lg" className="py-12">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <Avatar
            src={profile?.avatarUrl ?? null}
            name={displayName}
            size="xl"
            ariaLabel={displayName}
          />
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {displayName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>

        <Card variant="surface" padding="lg">
          <h1 className="text-2xl font-bold tracking-tight">
            {t(messages, 'account.profile.title')}
          </h1>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.firstName')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {profile?.firstName || noValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.lastName')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {profile?.lastName || noValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.displayName')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {profile?.displayName || noValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.currentGrade')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {profile?.currentGrade ?? noValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.preferredLocale')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {profile?.preferredLocale ?? noValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(messages, 'account.profile.fields.avatarUrl')}
              </dt>
              <dd className="mt-1 break-all text-sm text-slate-900 dark:text-slate-100">
                {profile?.avatarUrl || noValue}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <Link href={`/${locale}/profil/modifier`} className="inline-flex">
              <Button variant="primary" size="md">
                {t(messages, 'account.profile.editCta')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}
