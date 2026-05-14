import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { guardMinorParentLink, requireApiUser } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';
import { getPublishedQuizByActivityId } from '../../../../../lib/learning/catalog';

import { QuizForm } from './QuizForm';

import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

type QuizRouteParams = LocaleRouteParams & {
  readonly activityId: string;
};

export default async function QuizPage({
  params,
}: {
  readonly params: QuizRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireApiUser();
  await guardMinorParentLink(user, locale);
  const quiz = await getPublishedQuizByActivityId(params.activityId, locale);
  if (!quiz) notFound();

  const messages = getMessages(locale);
  const c = (key: string) => t(messages, `quiz.${key}`);

  return (
    <Container width="md" className="py-12 sm:py-16">
      <Link
        href={`/${locale}/apprendre/${quiz.lesson.slug}`}
        className="text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        ← {c('back')}
      </Link>

      <header className="mt-8">
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {quiz.lesson.subject} · {quiz.lesson.level}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {quiz.title}
        </h1>
        {quiz.introduction ? (
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            {quiz.introduction}
          </p>
        ) : null}
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          {c('score')} : {quiz.passingScore ?? 0} %
        </p>
      </header>

      <QuizForm
        activityId={quiz.id}
        locale={locale}
        startedAt={new Date().toISOString()}
        questions={quiz.questions.map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          points: question.points,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            label: answer.label,
          })),
        }))}
        copy={{
          submit: c('submit'),
          submitting: c('submitting'),
          points: c('points'),
          multiSelectHint: c('multiSelectHint'),
          fillBlankHint: c('fillBlankHint'),
          shortAnswerHint: c('shortAnswerHint'),
          textAnswerPlaceholder: c('textAnswerPlaceholder'),
          errors: {
            invalid: t(messages, 'quiz.errors.invalid'),
            notFound: t(messages, 'quiz.errors.notFound'),
            incomplete: t(messages, 'quiz.errors.incomplete'),
            unknown: t(messages, 'quiz.errors.unknown'),
          },
        }}
      />
    </Container>
  );
}
