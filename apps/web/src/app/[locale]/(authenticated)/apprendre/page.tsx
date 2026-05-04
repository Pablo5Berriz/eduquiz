import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { guardMinorParentLink, requireApiUser } from '../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';
import {
  getLearnerLearningOverview,
  getPublishedLearningCatalog,
} from '../../../../lib/learning/catalog';

import type { RlsRole } from '@eduquiz/db';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export default async function LearnPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireApiUser();
  await guardMinorParentLink(user, locale);
  const [courses, overview] = await Promise.all([
    getPublishedLearningCatalog(locale),
    getLearnerLearningOverview(user.id, user.role as RlsRole, locale),
  ]);

  const messages = getMessages(locale);
  const c = (key: string) => t(messages, `learn.${key}`);

  // La map des dernières tentatives par activité sert uniquement à afficher
  // "Continuer" vs "Démarrer" et le score précédent sur chaque leçon du
  // catalogue. Les blocs progression/historique complets sont dans /accueil.
  const lastAttemptByActivityId = new Map(
    overview.recentAttempts.map((attempt) => [attempt.activityId, attempt]),
  );

  return (
    <Container width="lg" className="py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {c('eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {c('title')}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {c('subtitle')}
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="mt-10 rounded-lg border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {c('empty')}
        </p>
      ) : (
        <div className="mt-10 grid gap-6">
          {courses.map((course) => (
            <section
              key={course.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    {course.subject} · {course.level}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    {course.title}
                  </h2>
                  {course.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {course.description}
                    </p>
                  ) : null}
                </div>
                {course.estimatedMinutes > 0 ? (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {course.estimatedMinutes} {c('minutes')}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {c('lessons')}
              </h3>
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {course.lessons.map((lesson) => {
                  const lastAttempt = lesson.quizActivityId
                    ? lastAttemptByActivityId.get(lesson.quizActivityId)
                    : undefined;

                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                          {lesson.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {lesson.skills.join(', ')}
                          {lesson.questionCount > 0
                            ? ` · ${String(lesson.questionCount)} ${c('quiz')}`
                            : ''}
                        </p>
                        {lastAttempt ? (
                          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {c('lastAttempt')} : {String(lastAttempt.score)} % ·{' '}
                            {lastAttempt.passed ? c('passed') : c('failed')}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        href={`/${locale}/apprendre/${lesson.slug}`}
                        className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
                      >
                        {lastAttempt ? c('continue') : c('start')}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
