import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { guardMinorParentLink, requireAuthenticated } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';
import {
  getPublishedLessonBySlug,
  getQuizAttemptHistory,
} from '../../../../../lib/learning/catalog';

import { ExercisePractice } from './ExercisePractice';

import type { LessonContentBlock } from '../../../../../lib/learning/content';
import type { RlsRole } from '@eduquiz/db';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

type LessonRouteParams = LocaleRouteParams & {
  readonly lesson: string;
};

export default async function LessonPage({
  params,
}: {
  readonly params: LessonRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireAuthenticated(locale, `/apprendre/${params.lesson}`);
  await guardMinorParentLink(user, locale);
  const lesson = await getPublishedLessonBySlug(params.lesson, locale);
  if (!lesson) notFound();
  const attemptHistory = lesson.quizActivityId
    ? await getQuizAttemptHistory({
        activityId: lesson.quizActivityId,
        userId: user.id,
        role: user.role as RlsRole,
      })
    : [];

  const messages = getMessages(locale);
  const c = (key: string) => t(messages, `lesson.${key}`);

  return (
    <Container width="md" className="py-12 sm:py-16">
      <Link
        href={`/${locale}/apprendre`}
        className="text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        ← {c('back')}
      </Link>

      <header className="mt-8">
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {lesson.course.subject} · {lesson.course.level}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {lesson.summary || c('noObjectives')}
        </p>
      </header>

      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{c('skills')}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {lesson.skills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
          {c('lessonContent')}
        </h2>
        {lesson.content.blocks.length > 0 ? (
          <LessonContent blocks={lesson.content.blocks} />
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {c('noContent')}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
          {c('objectives')}
        </h2>
        {lesson.objectives.length > 0 ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {lesson.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {c('noObjectives')}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{c('exercise')}</h2>
        {lesson.exercise ? (
          <ExercisePractice
            exercise={lesson.exercise}
            copy={{
              check: c('checkExercise'),
              retry: c('retryExercise'),
              incomplete: c('exerciseIncomplete'),
              correct: c('exerciseCorrect'),
              incorrect: c('exerciseIncorrect'),
              hint: c('hint'),
              textAnswerPlaceholder: c('textAnswerPlaceholder'),
              matchingHint: c('matchingHint'),
              matchingSelectPlaceholder: c('matchingSelectPlaceholder'),
              orderingHint: c('orderingHint'),
              orderingMoveDown: c('orderingMoveDown'),
              orderingMoveUp: c('orderingMoveUp'),
            }}
          />
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {c('noExercise')}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{c('history')}</h2>
        {attemptHistory.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {attemptHistory.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {String(attempt.score)} % · {attempt.passed ? c('passed') : c('failed')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(attempt.submittedAt)}{' '}
                    · {attempt.rawScore}/{attempt.maxScore} · {c('duration')}{' '}
                    {String(Math.round(attempt.durationMs / 1000))}
                    {c('seconds')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/quiz/${attempt.activityId}/resultat/${attempt.id}`}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {c('result')}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {c('noHistory')}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-6 dark:border-brand-900 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{c('quiz')}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {String(lesson.quizQuestionCount)} {c('questions')}
              {lesson.estimatedMinutes > 0
                ? ` · ${String(lesson.estimatedMinutes)} ${c('minutes')}`
                : ''}
            </p>
          </div>
          {lesson.quizActivityId ? (
            <Link
              href={`/${locale}/quiz/${lesson.quizActivityId}`}
              className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
            >
              {c('startQuiz')}
            </Link>
          ) : (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {c('unavailable')}
            </p>
          )}
        </div>
      </section>
    </Container>
  );
}

function LessonContent({
  blocks,
}: {
  readonly blocks: readonly LessonContentBlock[];
}): JSX.Element {
  return (
    <div className="mt-5 space-y-5">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={`${block.type}-${String(index)}`}
              className="text-sm leading-7 text-slate-600 dark:text-slate-300"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={`${block.type}-${String(index)}`}
              className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        const toneClass =
          block.type === 'example'
            ? 'border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/20'
            : 'border-warning-200 bg-warning-50 dark:border-warning-900 dark:bg-warning-950/20';

        return (
          <div
            key={`${block.type}-${String(index)}`}
            className={`rounded-lg border p-4 ${toneClass}`}
          >
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {block.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {block.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
