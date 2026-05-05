import { prismaService as prisma } from '@eduquiz/db';
import { Button, Container, cn } from '@eduquiz/ui';
import Link from 'next/link';

import { requireAuthenticated } from '../../../../lib/auth/server';
import { getLearnerLearningOverview } from '../../../../lib/learning/catalog';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { RlsRole } from '@eduquiz/db';
import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Tableau de bord de l'utilisateur connecté — /[locale]/accueil
 *
 * Affiche :
 *  - salutation personnalisée + CTA "Continuer à apprendre"
 *  - 3 statistiques (tentatives, score moyen, compétences travaillées)
 *  - progression par compétence (5 premières)
 *  - historique des dernières tentatives (5 dernières)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  return {
    title: locale === 'fr' ? 'Accueil' : 'Home',
    robots: { index: false, follow: false },
  };
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  fr: {
    greeting: (name: string) => `Bonjour, ${name} !`,
    subtitle: "Voici un aperçu de ta progression.",
    ctaLearn: 'Continuer à apprendre',
    statsAttempts: 'Tentatives',
    statsAvgScore: 'Score moyen',
    statsSkills: 'Compétences',
    progressTitle: 'Progression par compétence',
    historyTitle: 'Dernières tentatives',
    emptyProgress: 'Termine un quiz pour voir ta progression ici.',
    emptyHistory: "Aucune tentative pour le moment — Lance un quiz !",
    passed: 'réussi',
    failed: 'à reprendre',
    result: 'Voir →',
    attempts: 'tentative(s)',
    viewAll: 'Voir tout →',
    startCta: 'Commencer',
    noGrade: "Complète ton profil pour voir du contenu adapté à ton niveau.",
    completeProfile: 'Compléter mon profil →',
    errorFallback: "Impossible de charger tes données pour le moment. Réessaie dans un instant.",
  },
  en: {
    greeting: (name: string) => `Hello, ${name}!`,
    subtitle: 'Here is an overview of your progress.',
    ctaLearn: 'Continue learning',
    statsAttempts: 'Attempts',
    statsAvgScore: 'Avg. score',
    statsSkills: 'Skills',
    progressTitle: 'Skill progress',
    historyTitle: 'Recent attempts',
    emptyProgress: 'Complete a quiz to see your progress here.',
    emptyHistory: 'No attempts yet — start a quiz!',
    passed: 'passed',
    failed: 'redo',
    result: 'View →',
    attempts: 'attempt(s)',
    viewAll: 'View all →',
    startCta: 'Start',
    noGrade: 'Complete your profile to see content matched to your grade.',
    completeProfile: 'Complete my profile →',
    errorFallback: 'Could not load your data right now. Please try again in a moment.',
  },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccueilPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const c = COPY[locale];
  const user = await requireAuthenticated(locale, `/${locale}/accueil`);

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, displayName: true, currentGrade: true, avatarUrl: true },
  });

  // Nom d'affichage
  const displayName =
    profile?.displayName && profile.displayName.length > 0
      ? profile.displayName
      : profile?.firstName && profile.firstName.length > 0
        ? profile.firstName
        : (user.email.split('@')[0] ?? user.email);

  // Données de progression — on isole les erreurs pour ne pas crasher la page
  let overview: Awaited<ReturnType<typeof getLearnerLearningOverview>> | null = null;
  let overviewError = false;
  try {
    overview = await getLearnerLearningOverview(user.id, user.role as RlsRole, locale);
  } catch {
    overviewError = true;
  }

  const totalAttempts = overview?.recentAttempts.length ?? 0;
  const avgScore =
    totalAttempts > 0 && overview
      ? Math.round(overview.recentAttempts.reduce((s, a) => s + a.score, 0) / totalAttempts)
      : null;
  const skillsCount = overview?.progressItems.length ?? 0;
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const profileIncomplete = !profile?.firstName || !profile.currentGrade;

  return (
    <div className="min-h-full">
      {/* ── Hero greeting ───────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Container
          width="lg"
          className="flex flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
              {c.greeting(displayName)}
            </h1>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{c.subtitle}</p>
          </div>
          <Link href={`/${locale}/apprendre`} className="inline-flex shrink-0">
            <Button variant="primary" size="lg">{c.ctaLearn}</Button>
          </Link>
        </Container>
      </div>

      <Container width="lg" className="py-10 space-y-8">

        {/* ── Profile nudge (si incomplet) ────────────────────────────────── */}
        {profileIncomplete && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
            <span className="mt-0.5 text-lg shrink-0" aria-hidden="true">⚠️</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-amber-800 dark:text-amber-300">{c.noGrade}</p>
            </div>
            <Link
              href={`/${locale}/profil/modifier`}
              className="shrink-0 text-xs font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
            >
              {c.completeProfile}
            </Link>
          </div>
        )}

        {/* ── Error state ─────────────────────────────────────────────────── */}
        {overviewError && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-800 dark:border-danger-800 dark:bg-danger-950/30 dark:text-danger-300">
            {c.errorFallback}
          </div>
        )}

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {!overviewError && (
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: c.statsAttempts, value: String(totalAttempts) },
              { label: c.statsAvgScore, value: avgScore !== null ? `${String(avgScore)} %` : '—' },
              { label: c.statsSkills, value: String(skillsCount) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Content grid ────────────────────────────────────────────────── */}
        {!overviewError && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">

            {/* Skill progress */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="font-semibold text-slate-950 dark:text-slate-50">{c.progressTitle}</h2>
                <Link
                  href={`/${locale}/apprendre`}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
                >
                  {c.viewAll}
                </Link>
              </div>
              <div className="p-6">
                {skillsCount === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="text-4xl" aria-hidden="true">📈</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.emptyProgress}</p>
                    <Link href={`/${locale}/apprendre`} className="inline-flex">
                      <Button variant="secondary" size="sm">{c.startCta}</Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {(overview?.progressItems ?? []).slice(0, 5).map((p) => (
                      <li key={p.id}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {p.skillName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {p.subjectName} · {String(p.attemptsCount)} {c.attempts}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-brand-700 dark:text-brand-300">
                            {String(p.masteryPercent)} %
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${String(p.masteryPercent)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Recent attempts */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="font-semibold text-slate-950 dark:text-slate-50">{c.historyTitle}</h2>
                <Link
                  href={`/${locale}/apprendre`}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
                >
                  {c.viewAll}
                </Link>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {totalAttempts === 0 ? (
                  <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                    <span className="text-4xl" aria-hidden="true">🎯</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.emptyHistory}</p>
                    <Link href={`/${locale}/apprendre`} className="inline-flex">
                      <Button variant="secondary" size="sm">{c.startCta}</Button>
                    </Link>
                  </div>
                ) : (
                  (overview?.recentAttempts ?? []).slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-4 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                          {attempt.lessonTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {attempt.subjectName} · {dateFormatter.format(attempt.submittedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-bold',
                            attempt.passed
                              ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                          )}
                        >
                          {String(attempt.score)} %
                        </span>
                        <Link
                          href={`/${locale}/quiz/${attempt.activityId}/resultat/${attempt.id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
                        >
                          {c.result}
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

      </Container>
 