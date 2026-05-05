import { prismaService as prisma } from '@eduquiz/db';
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

/** Grade label map — returns a human-readable label from a grade code. */
function gradeLabel(grade: string | null | undefined): string | null {
  if (!grade) return null;
  const map: Record<string, string> = {
    P3: 'Primaire 3', P4: 'Primaire 4', P5: 'Primaire 5', P6: 'Primaire 6',
    S1: 'Secondaire 1', S2: 'Secondaire 2', S3: 'Secondaire 3',
    S4: 'Secondaire 4', S5: 'Secondaire 5',
  };
  return map[grade] ?? grade;
}

/** Locale label */
function localeLabel(loc: string | null | undefined): string | null {
  if (!loc) return null;
  return loc.toUpperCase() === 'FR' ? 'Français' : 'English';
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
      : profile?.firstName
        ? `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`
        : (user.email.split('@')[0] ?? user.email);

  const fullName =
    profile?.firstName || profile?.lastName
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
      : null;

  const copy =
    locale === 'fr'
      ? {
          title: 'Mon profil',
          subtitle: 'Tes informations personnelles et préférences.',
          editCta: 'Modifier le profil',
          sections: {
            identity: 'Identité',
            preferences: 'Préférences',
            account: 'Compte',
          },
          fields: {
            firstName: 'Prénom',
            lastName: 'Nom de famille',
            displayName: "Pseudo affiché",
            currentGrade: 'Niveau scolaire',
            preferredLocale: 'Langue',
            email: 'Adresse e-mail',
          },
          completionBanner: {
            incomplete: 'Ton profil est incomplet.',
            cta: 'Complète-le maintenant pour une meilleure expérience.',
          },
        }
      : {
          title: 'My profile',
          subtitle: 'Your personal information and preferences.',
          editCta: 'Edit profile',
          sections: {
            identity: 'Identity',
            preferences: 'Preferences',
            account: 'Account',
          },
          fields: {
            firstName: 'First name',
            lastName: 'Last name',
            displayName: 'Display name',
            currentGrade: 'Grade level',
            preferredLocale: 'Language',
            email: 'Email address',
          },
          completionBanner: {
            incomplete: 'Your profile is incomplete.',
            cta: 'Complete it now for a better experience.',
          },
        };

  const isIncomplete = !profile?.firstName || !profile?.currentGrade;

  return (
    <Container width="lg" className="py-12">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* ── Header card: avatar + name + email + edit CTA ── */}
        <Card variant="surface" padding="lg">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <Avatar
                src={profile?.avatarUrl ?? null}
                name={displayName}
                size="xl"
                ariaLabel={displayName}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {displayName}
              </h1>
              {fullName && fullName !== displayName && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{fullName}</p>
              )}
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              {profile?.currentGrade && (
                <span className="mt-2 inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                  {gradeLabel(profile.currentGrade)}
                </span>
              )}
            </div>
            <div className="shrink-0">
              <Link href={`/${locale}/profil/modifier`} className="inline-flex">
                <Button variant="primary" size="md">
                  {copy.editCta}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* ── Completion nudge ── */}
        {isIncomplete && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
            <span className="mt-0.5 text-lg" aria-hidden="true">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {copy.completionBanner.incomplete}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {copy.completionBanner.cta}
              </p>
            </div>
          </div>
        )}

        {/* ── Identity ── */}
        <Card variant="surface" padding="lg">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {copy.sections.identity}
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {(
              [
                { label: copy.fields.firstName, value: profile?.firstName },
                { label: copy.fields.lastName, value: profile?.lastName },
                { label: copy.fields.displayName, value: profile?.displayName },
              ] as Array<{ label: string; value?: string | null }>
            ).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className={`text-sm font-medium ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                  {value || noValue}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* ── Preferences ── */}
        <Card variant="surface" padding="lg">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {copy.sections.preferences}
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {(
              [
                { label: copy.fields.currentGrade, value: gradeLabel(profile?.currentGrade) },
                { label: copy.fields.preferredLocale, value: localeLabel(profile?.preferredLocale) },
              ] as Array<{ label: string; value: string | null }>
            ).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className={`text-sm font-medium ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                  {value ?? noValue}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* ── Account ── */}
        <Card variant="surface" padding="lg">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {copy.sections.account}
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-slate-500 dark:text-slate-400">{copy.fields.email}</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.email}
              </dd>
            </div>
          </dl>
        </Card>

      </div>
    </C