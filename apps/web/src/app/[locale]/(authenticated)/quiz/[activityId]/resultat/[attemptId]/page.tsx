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

type AttemptResult = NonNullable<Awaited<ReturnType<typeof getAttemptResult>>>;
type AttemptResultAnswer = AttemptResult['answers'][number];

export default async function QuizResultPage({
  params,
}: {
  readonly params: ResultRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const c = (key: string) => t(messages, `quizResult.${key}`);
  const quizCopy = (key: string) => t(messages, `quiz.${key}`);
  const user = await requireApiUser();
  await guardMinorParentLink(user, locale);
  const result = await getAttemptResult({
    activityId: params.activityId,
    attemptId: params.attemptId,
    userId: user.id,
    role: user.role as RlsRole,
    locale,
    unknownAnswerLabel: quizCopy('matchingUnknownAnswer'),
    unknownOrderingAnswerLabel: quizCopy('orderingUnknownAnswer'),
  });
  if (!result) notFound();

  const submittedAtLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(result.submittedAt);
  const learningState = getLearningState(result.score);

  return (
    <Container width="md" className="py-12 sm:py-16">
      <header
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        data-testid="quiz-result"
      >
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {result.lesson.subject} · {result.lesson.level}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {c('title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {result.quizTitle} · {c('submittedAt')} {submittedAtLabel}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-5xl font-bold text-slate-950 dark:text-slate-50">{result.score} %</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {c('scoreDetail')} {formatPoints(result.rawScore, result.maxScore, c('point'))}
            </p>
          </div>
          {result.passingScore !== null ? (
            <span className="rounded-md bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
              {result.passed ? c('passedStatus') : c('failedStatus')} · {c('passingScore')}{' '}
              {String(result.passingScore)} %
            </span>
          ) : null}
        </div>

        {result.lesson.skills.length > 0 ? (
          <section className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {c('skillsTitle')}
            </h2>
            <ul className="mt-3 space-y-2">
              {result.lesson.skills.map((skill) => (
                <li key={skill.id} className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-slate-500 dark:text-slate-400"> · {skill.subject}</span>
                  <span className="block text-slate-600 dark:text-slate-300">
                    {c(learningState.key)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-6 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            {c('nextStepTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {c(learningState.nextStepKey)}
          </p>
        </div>

        <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label={c('actionsLabel')}>
          <Link
            href={`/${locale}/apprendre/${result.lesson.slug}`}
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
          >
            {c('retry')}
          </Link>
          <Link
            href={`/${locale}/quiz/${params.activityId}`}
            className="inline-flex items-center justify-center rounded-md border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-brand-800 dark:bg-slate-950 dark:text-brand-300 dark:hover:bg-slate-900"
          >
            {c('retakeQuiz')}
          </Link>
          <Link
            href={`/${locale}/apprendre`}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {c('catalog')}
          </Link>
          <Link
            href={`/${locale}/accueil`}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {c('progress')}
          </Link>
        </nav>
      </header>

      <section className="mt-8" data-testid="quiz-result-correction">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{c('answers')}</h2>
        <div className="mt-4 space-y-4">
          {result.answers.map((answer, index) => (
            <CorrectionCard
              key={answer.questionId}
              answer={answer}
              index={index}
              c={c}
              quizCopy={quizCopy}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}

function CorrectionCard({
  answer,
  index,
  c,
  quizCopy,
}: {
  readonly answer: AttemptResultAnswer;
  readonly index: number;
  readonly c: (key: string) => string;
  readonly quizCopy: (key: string) => string;
}): JSX.Element {
  return (
    <article
      className={`rounded-lg border bg-white p-5 dark:bg-slate-900 ${
        answer.isCorrect
          ? 'border-success-200 dark:border-success-900'
          : 'border-warning-300 dark:border-warning-900'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {c('question')} {String(index + 1)} · {questionTypeLabel(answer.questionType, c)}
          </p>
          <h3 className="mt-2 font-semibold text-slate-950 dark:text-slate-50">{answer.prompt}</h3>
        </div>
        <span
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            answer.isCorrect
              ? 'bg-success-50 text-success-700 dark:bg-success-950/30 dark:text-success-400'
              : 'bg-warning-50 text-warning-800 dark:bg-warning-950/30 dark:text-warning-400'
          }`}
        >
          {answer.isCorrect ? c('answerUnderstood') : c('answerToReview')}
        </span>
      </div>

      <dl className="mt-5 grid gap-4">
        <AnswerBlock title={selectedTitle(answer.questionType, c, quizCopy)}>
          <AnswerValue answer={answer} kind="selected" />
        </AnswerBlock>
        <AnswerBlock title={correctTitle(answer.questionType, c, quizCopy)}>
          <AnswerValue answer={answer} kind="correct" />
        </AnswerBlock>
      </dl>

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
          {c('explanationTitle')}
        </h4>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {answer.explanation || c('explanationFallback')}
        </p>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">
        {c('pointsEarned')} {formatPoints(answer.pointsEarned, answer.pointsPossible, c('point'))}
      </p>
    </article>
  );
}

function AnswerBlock({
  title,
  children,
}: {
  readonly title: string;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <div>
      <dt className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</dt>
      <dd className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</dd>
    </div>
  );
}

function AnswerValue({
  answer,
  kind,
}: {
  readonly answer: AttemptResultAnswer;
  readonly kind: 'selected' | 'correct';
}): JSX.Element {
  const isOrdering = answer.questionType === 'ORDERING';
  const labels = getAnswerLabels(answer, kind);

  if (isOrdering) {
    return <OrderedAnswerLabels labels={labels} />;
  }

  return labels.length > 0 ? (
    <ul className="space-y-1 font-medium">
      {labels.map((label, index) => (
        <li key={`${label}-${String(index)}`}>{label}</li>
      ))}
    </ul>
  ) : (
    <span className="font-medium">—</span>
  );
}

function OrderedAnswerLabels({ labels }: { readonly labels: readonly string[] }): JSX.Element {
  return labels.length > 0 ? (
    <ol className="mt-2 list-decimal space-y-1 pl-5 font-medium">
      {labels.map((label, index) => (
        <li key={`${label}-${String(index)}`}>{label}</li>
      ))}
    </ol>
  ) : (
    <span className="font-medium">—</span>
  );
}

function getAnswerLabels(
  answer: AttemptResultAnswer,
  kind: 'selected' | 'correct',
): readonly string[] {
  if (answer.questionType === 'MATCHING') {
    return kind === 'selected' ? answer.selectedMatchLabels : answer.correctMatchLabels;
  }

  if (answer.questionType === 'ORDERING') {
    return kind === 'selected' ? answer.selectedOrderingLabels : answer.correctOrderingLabels;
  }

  if (kind === 'selected') {
    return answer.selectedText ? [answer.selectedText] : answer.selectedAnswerLabels;
  }

  return answer.correctAnswerLabels;
}

function selectedTitle(
  questionType: string,
  c: (key: string) => string,
  quizCopy: (key: string) => string,
): string {
  if (questionType === 'ORDERING') return quizCopy('orderingSelectedOrder');
  if (questionType === 'MATCHING') return c('selectedPairs');
  return c('selected');
}

function correctTitle(
  questionType: string,
  c: (key: string) => string,
  quizCopy: (key: string) => string,
): string {
  if (questionType === 'ORDERING') return quizCopy('orderingCorrectOrder');
  if (questionType === 'MATCHING') return c('correctPairs');
  return c('correct');
}

function questionTypeLabel(questionType: string, c: (key: string) => string): string {
  const keyByType: Record<string, string> = {
    MCQ_SINGLE: 'typeMcqSingle',
    MCQ_MULTI: 'typeMcqMulti',
    TRUE_FALSE: 'typeTrueFalse',
    FILL_IN_THE_BLANK: 'typeFillBlank',
    SHORT_ANSWER: 'typeShortAnswer',
    MATCHING: 'typeMatching',
    ORDERING: 'typeOrdering',
  };

  return c(keyByType[questionType] ?? 'typeUnknown');
}

function getLearningState(score: number): {
  readonly key: string;
  readonly nextStepKey: string;
} {
  if (score >= 80) {
    return { key: 'mastered', nextStepKey: 'nextMastered' };
  }
  if (score >= 50) {
    return { key: 'review', nextStepKey: 'nextReview' };
  }
  return { key: 'practice', nextStepKey: 'nextPractice' };
}

function formatPoints(earned: number, possible: number, pointLabel: string): string {
  const suffix = possible > 1 ? 's' : '';
  return `${String(earned)}/${String(possible)} ${pointLabel}${suffix}`;
}
