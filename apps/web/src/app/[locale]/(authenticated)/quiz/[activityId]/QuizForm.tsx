'use client';

import { Alert, Button } from '@eduquiz/ui';
import { useState, useTransition } from 'react';

import {
  submitQuizAttempt,
  type SubmitQuizErrorCode,
  type SubmitQuizResult,
} from '../../../../../lib/learning/actions';

import type { JSX } from 'react';

export interface QuizFormQuestion {
  readonly id: string;
  readonly type?: string;
  readonly prompt: string;
  readonly answers: readonly {
    readonly id: string;
    readonly label: string;
    readonly side?: 'left' | 'right' | null;
  }[];
}

export interface QuizFormCopy {
  readonly submit: string;
  readonly submitting: string;
  readonly multiSelectHint: string;
  readonly fillBlankHint: string;
  readonly shortAnswerHint: string;
  readonly matchingHint: string;
  readonly matchingSelectPlaceholder: string;
  readonly orderingHint: string;
  readonly orderingMoveDown: string;
  readonly orderingMoveUp: string;
  readonly textAnswerPlaceholder: string;
  readonly errors: Record<SubmitQuizErrorCode, string>;
}

export interface QuizFormProps {
  readonly activityId: string;
  readonly locale: 'fr' | 'en';
  readonly startedAt: string;
  readonly questions: readonly QuizFormQuestion[];
  readonly copy: QuizFormCopy;
}

export function QuizForm({
  activityId,
  locale,
  startedAt,
  questions,
  copy,
}: QuizFormProps): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitQuizResult>({ ok: true });
  const [orderingAnswerIdsByQuestionId, setOrderingAnswerIdsByQuestionId] = useState<
    Record<string, readonly string[]>
  >({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextResult = (await submitQuizAttempt(formData)) as SubmitQuizResult | undefined;
      if (nextResult) {
        setResult(nextResult);
      }
    });
  }

  const missingQuestionIds = new Set(!result.ok ? (result.missingQuestionIds ?? []) : []);
  const formError = !result.ok ? copy.errors[result.error] : undefined;

  function moveOrderingAnswer(
    questionId: string,
    answerIds: readonly string[],
    index: number,
    direction: -1 | 1,
  ): void {
    setOrderingAnswerIdsByQuestionId((current) => ({
      ...current,
      [questionId]: moveAnswerId(answerIds, index, direction),
    }));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6" data-testid="quiz-form">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={startedAt} />

      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      {questions.map((question, index) => {
        const hasError = missingQuestionIds.has(question.id);
        const isOrdering = question.type === 'ORDERING';
        const isMatching = question.type === 'MATCHING';
        const isFillInTheBlank = question.type === 'FILL_IN_THE_BLANK';
        const isShortAnswer = question.type === 'SHORT_ANSWER';
        const inputType = question.type === 'MCQ_MULTI' ? 'checkbox' : 'radio';
        const matchingAnswers = getMatchingAnswerGroups(question.answers);
        const orderingAnswerIds = getOrderingAnswerIds(
          question.answers,
          orderingAnswerIdsByQuestionId[question.id],
        );
        const orderingAnswers = getOrderedAnswers(question.answers, orderingAnswerIds);

        return (
          <fieldset
            key={question.id}
            aria-invalid={hasError}
            data-testid="quiz-question"
            data-question-id={question.id}
            data-question-type={question.type}
            className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <legend className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              {index + 1}. {question.prompt}
            </legend>
            {question.type === 'MCQ_MULTI' ? (
              <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                {copy.multiSelectHint}
              </p>
            ) : null}
            {isMatching ? (
              <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                {copy.matchingHint}
              </p>
            ) : null}
            {isOrdering ? (
              <>
                <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                  {copy.orderingHint}
                </p>
                <OrderingAnswerList
                  questionId={question.id}
                  answers={orderingAnswers}
                  moveDownLabel={copy.orderingMoveDown}
                  moveUpLabel={copy.orderingMoveUp}
                  onMove={(answerIndex, direction) => {
                    moveOrderingAnswer(question.id, orderingAnswerIds, answerIndex, direction);
                  }}
                />
              </>
            ) : isMatching ? (
              <div className="mt-5 space-y-3">
                {matchingAnswers.leftAnswers.map((leftAnswer) => (
                  <label
                    key={leftAnswer.id}
                    className="grid gap-2 rounded-md border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)] sm:items-center"
                  >
                    <span>{leftAnswer.label}</span>
                    <select
                      name={`matching:${question.id}:${leftAnswer.id}`}
                      defaultValue=""
                      aria-invalid={hasError}
                      data-testid="quiz-matching-select"
                      data-left-label={leftAnswer.label}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="">{copy.matchingSelectPlaceholder}</option>
                      {matchingAnswers.rightAnswers.map((rightAnswer) => (
                        <option key={rightAnswer.id} value={rightAnswer.id}>
                          {rightAnswer.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ) : isFillInTheBlank ? (
              <div className="mt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {copy.fillBlankHint}
                  </span>
                  <input
                    type="text"
                    name={`question:${question.id}`}
                    placeholder={copy.textAnswerPlaceholder}
                    aria-invalid={hasError}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>
              </div>
            ) : isShortAnswer ? (
              <div className="mt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {copy.shortAnswerHint}
                  </span>
                  <textarea
                    name={`question:${question.id}`}
                    placeholder={copy.textAnswerPlaceholder}
                    aria-invalid={hasError}
                    rows={3}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {question.answers.map((answer) => (
                  <label
                    key={answer.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-800 dark:hover:bg-slate-950"
                  >
                    <input
                      type={inputType}
                      name={`question:${question.id}`}
                      value={answer.id}
                      data-testid="quiz-choice"
                      className="mt-1 h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-500"
                    />
                    <span>{answer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}

      <Button type="submit" variant="primary" size="lg" isLoading={pending} data-testid="quiz-submit">
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

interface MatchingAnswerOption {
  readonly id: string;
  readonly label: string;
  readonly side?: 'left' | 'right' | null;
}

interface OrderingAnswerListProps {
  readonly questionId: string;
  readonly answers: readonly MatchingAnswerOption[];
  readonly moveDownLabel: string;
  readonly moveUpLabel: string;
  readonly onMove: (index: number, direction: -1 | 1) => void;
}

function OrderingAnswerList({
  questionId,
  answers,
  moveDownLabel,
  moveUpLabel,
  onMove,
}: OrderingAnswerListProps): JSX.Element {
  return (
    <div className="mt-5 space-y-3">
      {answers.map((answer, index) => (
        <div
          key={answer.id}
          data-testid="quiz-ordering-item"
          data-answer-label={answer.label}
          className="grid gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        >
          <input type="hidden" name={`ordering:${questionId}`} value={answer.id} />
          <span>{answer.label}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={index === 0}
              data-testid="quiz-ordering-move-up"
              onClick={() => {
                onMove(index, -1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {moveUpLabel}
            </button>
            <button
              type="button"
              disabled={index === answers.length - 1}
              data-testid="quiz-ordering-move-down"
              onClick={() => {
                onMove(index, 1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {moveDownLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getMatchingAnswerGroups(answers: readonly MatchingAnswerOption[]): {
  readonly leftAnswers: readonly MatchingAnswerOption[];
  readonly rightAnswers: readonly MatchingAnswerOption[];
} {
  const leftAnswers = answers.filter((answer) => answer.side === 'left');
  const rightAnswers = answers.filter((answer) => answer.side === 'right');

  return { leftAnswers, rightAnswers };
}

function getOrderingAnswerIds(
  answers: readonly MatchingAnswerOption[],
  storedAnswerIds: readonly string[] | undefined,
): readonly string[] {
  return storedAnswerIds?.length === answers.length
    ? storedAnswerIds
    : answers.map((answer) => answer.id);
}

function getOrderedAnswers(
  answers: readonly MatchingAnswerOption[],
  answerIds: readonly string[],
): readonly MatchingAnswerOption[] {
  const answersById = new Map(answers.map((answer) => [answer.id, answer]));
  return answerIds
    .map((answerId) => answersById.get(answerId))
    .filter((answer) => answer !== undefined);
}

function moveAnswerId(
  answerIds: readonly string[],
  index: number,
  direction: -1 | 1,
): readonly string[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= answerIds.length) return answerIds;

  const nextAnswerIds = [...answerIds];
  const currentAnswerId = nextAnswerIds[index];
  const targetAnswerId = nextAnswerIds[targetIndex];
  if (currentAnswerId === undefined || targetAnswerId === undefined) return answerIds;

  nextAnswerIds[index] = targetAnswerId;
  nextAnswerIds[targetIndex] = currentAnswerId;
  return nextAnswerIds;
}
