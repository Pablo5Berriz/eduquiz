import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { guardMinorParentLink, requireApiUser } from '../../../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../../../lib/i18n/locale';
import { getAttemptResult } from '../../../../../../../lib/learning/catalog';

import type { RlsRole } from '@eduquiz/db';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

type ResultRouteParams = LocaleRouteParams & {
  readonly activityId: string;
  readonly attemptId: string;
};

export default async function QuizResultPage({
  params,
}: {
  readonly params: ResultRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireApiUser();
  await guardMinorParentLink(user, locale);
  const result = await getAttemptResult({
    activityId: params.activityId,
    attemptId: params.attemptId,
    userId: user.id,
    role: user.role as RlsRole,
    locale,
  });
  if (!result) notFound();

  const messages = getMessages(locale);
  const c = (key: string) => t(messages, `quizResult.${key}`);

  return (
    <Container width="md" className="py-12 sm:py-16">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {result.lesson.subject} · {result.lesson.level}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {c('title')}
        </h1>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-5xl font-bold text-slate-950 dark:text-slate-50">{result.score} %</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {result.rawScore}/{result.maxScore} {c('point')}
              {result.maxScore > 1 ? 's' : ''}
            </p>
          </div>
          <span className="rounded-md bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            {c('passed')} : {result.passed ? 'oui' : 'non'}
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${locale}/apprendre/${result.lesson.slug}`}
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
          >
            {c('retry')}
          </Link>
          <Link
            href={`/${locale}/apprendre`}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {c('catalog')}
          </Link>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{c('answers')}</h2>
        <div className="mt-4 space-y-4">
          {result.answers.map((answer) => (
            <article
              key={answer.questionId}
              className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-semibold text-slate-950 dark:text-slate-50">{answer.prompt}</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {c('selected')} :{' '}
                <span className="font-medium">
                  {answer.selectedText ??
                    (answer.selectedAnswerLabels.length > 0
                      ? answer.selectedAnswerLabels.join(', ')
                      : '—')}
                </span>
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {c('correct')} :{' '}
                <span className="font-medium">{answer.correctAnswerLabels.join(', ')}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {answer.isCorrect ? `+${String(answer.pointsEarned)}` : '+0'} {c('point')}
                {answer.pointsEarned > 1 ? 's' : ''}
              </p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
