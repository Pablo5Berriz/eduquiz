'use client';

import { Alert, Button } from '@eduquiz/ui';
import { useState } from 'react';

import { scoreTextAnswer } from '../../../../../lib/learning/scoring';

import type { JSX } from 'react';

export interface PracticeExercise {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hint: string;
  readonly explanation: string;
  readonly questions: readonly {
    readonly id: string;
    /**
     * Type de question, propagé depuis ExerciseType.
     * Utilisé pour choisir le rendu approprié (ex. TRUE_FALSE → boutons Vrai/Faux).
     */
    readonly type?: string;
    readonly prompt: string;
    readonly explanation: string;
    readonly answers: readonly {
      readonly id: string;
      readonly label: string;
      readonly pairId?: string | null;
      readonly isCorrect: boolean;
      readonly feedback: string;
    }[];
  }[];
}

export interface ExercisePracticeCopy {
  readonly check: string;
  readonly retry: string;
  readonly incomplete: string;
  readonly correct: string;
  readonly incorrect: string;
  readonly hint: string;
  readonly textAnswerPlaceholder?: string;
  readonly matchingHint: string;
  readonly matchingSelectPlaceholder: string;
  readonly orderingHint: string;
  readonly orderingMoveDown: string;
  readonly orderingMoveUp: string;
}

export interface ExercisePracticeProps {
  readonly exercise: PracticeExercise;
  readonly copy: ExercisePracticeCopy;
}

// ── Sous-composants de rendu des réponses ─────────────────────────────────────

interface AnswerInputProps {
  readonly questionId: string;
  readonly answers: PracticeExercise['questions'][number]['answers'];
  readonly selectedAnswerId: string | undefined;
  readonly disabled: boolean;
  readonly onSelect: (answerId: string) => void;
}

/**
 * Rendu pour MCQ_SINGLE et les types inconnus : liste de radios stylés.
 */
function RadioAnswerList({
  questionId,
  answers,
  selectedAnswerId,
  disabled,
  onSelect,
}: AnswerInputProps): JSX.Element {
  return (
    <div className="mt-4 space-y-3">
      {answers.map((answer) => (
        <label
          key={answer.id}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-800 dark:hover:bg-slate-900"
        >
          <input
            type="radio"
            name={`exercise:${questionId}`}
            value={answer.id}
            checked={selectedAnswerId === answer.id}
            disabled={disabled}
            onChange={() => {
              onSelect(answer.id);
            }}
            className="mt-1 h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-500"
          />
          <span>{answer.label}</span>
        </label>
      ))}
    </div>
  );
}

interface MultiAnswerInputProps {
  readonly questionId: string;
  readonly answers: PracticeExercise['questions'][number]['answers'];
  readonly selectedAnswerIds: readonly string[];
  readonly disabled: boolean;
  readonly onToggle: (answerId: string) => void;
}

function CheckboxAnswerList({
  questionId,
  answers,
  selectedAnswerIds,
  disabled,
  onToggle,
}: MultiAnswerInputProps): JSX.Element {
  return (
    <div className="mt-4 space-y-3">
      {answers.map((answer) => (
        <label
          key={answer.id}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-800 dark:hover:bg-slate-900"
        >
          <input
            type="checkbox"
            name={`exercise:${questionId}`}
            value={answer.id}
            checked={selectedAnswerIds.includes(answer.id)}
            disabled={disabled}
            onChange={() => {
              onToggle(answer.id);
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
          />
          <span>{answer.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Rendu pour TRUE_FALSE : deux grands boutons côte-à-côte (Vrai / Faux).
 *
 * L'ordre d'affichage suit l'ordre des réponses renvoyé par la DB (ordinal ASC),
 * ce qui correspond toujours à [Vrai, Faux] dans le seed courant.
 */
function TrueFalseButtons({
  answers,
  selectedAnswerId,
  disabled,
  onSelect,
}: AnswerInputProps): JSX.Element {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {answers.map((answer) => {
        const isSelected = selectedAnswerId === answer.id;
        return (
          <button
            key={answer.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={answer.label}
            disabled={disabled}
            onClick={() => {
              onSelect(answer.id);
            }}
            className={[
              'flex min-h-[72px] items-center justify-center rounded-xl border-2 px-6 py-4',
              'text-lg font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              isSelected
                ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950/30 dark:text-brand-300'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:bg-slate-900',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            {answer.label}
          </button>
        );
      })}
    </div>
  );
}

interface TextAnswerInputProps {
  readonly questionId: string;
  readonly value: string;
  readonly disabled: boolean;
  readonly placeholder?: string | undefined;
  readonly onChange: (value: string) => void;
}

function TextAnswerInput({
  questionId,
  value,
  disabled,
  placeholder,
  onChange,
}: TextAnswerInputProps): JSX.Element {
  return (
    <label className="mt-4 block">
      <span className="sr-only">{placeholder}</span>
      <input
        type="text"
        name={`exercise:${questionId}`}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

function ShortAnswerTextarea({
  questionId,
  value,
  disabled,
  placeholder,
  onChange,
}: TextAnswerInputProps): JSX.Element {
  return (
    <label className="mt-4 block">
      <span className="sr-only">{placeholder}</span>
      <textarea
        name={`exercise:${questionId}`}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

interface MatchingAnswerOption {
  readonly id: string;
  readonly label: string;
  readonly pairId?: string | null;
}

interface MatchingAnswerListProps {
  readonly questionId: string;
  readonly answers: readonly MatchingAnswerOption[];
  readonly selectedMatches: Readonly<Record<string, string>>;
  readonly disabled: boolean;
  readonly placeholder: string;
  readonly onSelect: (leftId: string, rightId: string) => void;
}

function MatchingAnswerList({
  questionId,
  answers,
  selectedMatches,
  disabled,
  placeholder,
  onSelect,
}: MatchingAnswerListProps): JSX.Element {
  const { leftAnswers, rightAnswers } = getMatchingAnswerGroups(answers);

  return (
    <div className="mt-4 space-y-3">
      {leftAnswers.map((leftAnswer) => (
        <label
          key={leftAnswer.id}
          className="grid gap-2 rounded-md border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)] sm:items-center"
        >
          <span>{leftAnswer.label}</span>
          <select
            name={`matching:${questionId}:${leftAnswer.id}`}
            value={selectedMatches[leftAnswer.id] ?? ''}
            disabled={disabled}
            onChange={(event) => {
              onSelect(leftAnswer.id, event.currentTarget.value);
            }}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">{placeholder}</option>
            {rightAnswers.map((rightAnswer) => (
              <option key={rightAnswer.id} value={rightAnswer.id}>
                {rightAnswer.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

interface OrderingAnswerListProps {
  readonly questionId: string;
  readonly answers: readonly MatchingAnswerOption[];
  readonly disabled: boolean;
  readonly moveDownLabel: string;
  readonly moveUpLabel: string;
  readonly onMove: (index: number, direction: -1 | 1) => void;
}

function OrderingAnswerList({
  questionId,
  answers,
  disabled,
  moveDownLabel,
  moveUpLabel,
  onMove,
}: OrderingAnswerListProps): JSX.Element {
  return (
    <div className="mt-4 space-y-3">
      {answers.map((answer, index) => (
        <div
          key={answer.id}
          className="grid gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        >
          <input type="hidden" name={`ordering:${questionId}`} value={answer.id} />
          <span>{answer.label}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled || index === 0}
              onClick={() => {
                onMove(index, -1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {moveUpLabel}
            </button>
            <button
              type="button"
              disabled={disabled || index === answers.length - 1}
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

// ── Composant principal ───────────────────────────────────────────────────────

export function ExercisePractice({ exercise, copy }: ExercisePracticeProps): JSX.Element {
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<Record<string, readonly string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const [orderingAnswerIdsByQuestionId, setOrderingAnswerIdsByQuestionId] = useState<
    Record<string, readonly string[]>
  >({});
  const [checked, setChecked] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);

  function handleSelect(questionId: string, answerId: string): void {
    setSelectedAnswerIds((current) => ({ ...current, [questionId]: [answerId] }));
    setChecked(false);
    setShowIncomplete(false);
  }

  function handleToggle(questionId: string, answerId: string): void {
    setSelectedAnswerIds((current) => {
      const currentAnswerIds = current[questionId] ?? [];
      const nextAnswerIds = currentAnswerIds.includes(answerId)
        ? currentAnswerIds.filter((id) => id !== answerId)
        : [...currentAnswerIds, answerId];

      return { ...current, [questionId]: nextAnswerIds };
    });
    setChecked(false);
    setShowIncomplete(false);
  }

  function handleTextChange(questionId: string, value: string): void {
    setTextAnswers((current) => ({ ...current, [questionId]: value }));
    setChecked(false);
    setShowIncomplete(false);
  }

  function handleMatchSelect(questionId: string, leftId: string, rightId: string): void {
    setMatchingAnswers((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? {}), [leftId]: rightId },
    }));
    setChecked(false);
    setShowIncomplete(false);
  }

  function handleOrderingMove(
    questionId: string,
    answerIds: readonly string[],
    index: number,
    direction: -1 | 1,
  ): void {
    setOrderingAnswerIdsByQuestionId((current) => ({
      ...current,
      [questionId]: moveAnswerId(answerIds, index, direction),
    }));
    setChecked(false);
    setShowIncomplete(false);
  }

  function check(): void {
    const complete = exercise.questions.every((question) => {
      if (question.type === 'MATCHING') {
        return isMatchingComplete(question.answers, matchingAnswers[question.id] ?? {});
      }
      if (question.type === 'ORDERING') {
        return isOrderingComplete(question.answers, orderingAnswerIdsByQuestionId[question.id]);
      }
      return question.type === 'FILL_IN_THE_BLANK' || question.type === 'SHORT_ANSWER'
        ? (textAnswers[question.id] ?? '').trim().length > 0
        : selectedAnswerIds[question.id]?.length;
    });
    setShowIncomplete(!complete);
    setChecked(complete);
  }

  function retry(): void {
    setSelectedAnswerIds({});
    setTextAnswers({});
    setMatchingAnswers({});
    setOrderingAnswerIdsByQuestionId({});
    setChecked(false);
    setShowIncomplete(false);
  }

  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        {exercise.instructions}
      </p>
      {exercise.hint ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{copy.hint} :</span>{' '}
          {exercise.hint}
        </p>
      ) : null}

      {showIncomplete ? (
        <div className="mt-4">
          <Alert tone="danger">{copy.incomplete}</Alert>
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {exercise.questions.map((question, index) => {
          const questionSelectedAnswerIds = selectedAnswerIds[question.id] ?? [];
          const selectedAnswerId = questionSelectedAnswerIds[0];
          const selectedAnswer = question.answers.find((answer) => answer.id === selectedAnswerId);
          const correctAnswerIds = question.answers
            .filter((answer) => answer.isCorrect)
            .map((answer) => answer.id);
          const isMulti = question.type === 'MCQ_MULTI';
          const isMatching = question.type === 'MATCHING';
          const isOrdering = question.type === 'ORDERING';
          const isFillInTheBlank = question.type === 'FILL_IN_THE_BLANK';
          const isShortAnswer = question.type === 'SHORT_ANSWER';
          const isTextAnswer = isFillInTheBlank || isShortAnswer;
          const isAssociationAnswer = isMatching || isOrdering;
          const questionTextAnswer = textAnswers[question.id] ?? '';
          const questionMatchingAnswers = matchingAnswers[question.id] ?? {};
          const questionOrderingAnswerIds = getOrderingAnswerIds(
            question.answers,
            orderingAnswerIdsByQuestionId[question.id],
          );
          const questionOrderingAnswers = getOrderedAnswers(
            question.answers,
            questionOrderingAnswerIds,
          );
          const hasMatchingAnswer = isMatchingComplete(question.answers, questionMatchingAnswers);
          const hasOrderingAnswer = isOrderingComplete(
            question.answers,
            orderingAnswerIdsByQuestionId[question.id],
          );
          const correctAnswerLabels = question.answers
            .filter((answer) => answer.isCorrect)
            .map((answer) => answer.label);
          const isCorrect = isTextAnswer
            ? scoreTextAnswer(questionTextAnswer, correctAnswerLabels)
            : isMulti
              ? sameAnswerSet(questionSelectedAnswerIds, correctAnswerIds)
              : Boolean(selectedAnswer?.isCorrect);
          const isTrueFalse = question.type === 'TRUE_FALSE';
          const feedbackText = firstNonEmptyText(
            selectedAnswer?.feedback,
            question.explanation,
            exercise.explanation,
          );

          return (
            <fieldset
              key={question.id}
              className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <legend className="text-base font-semibold text-slate-950 dark:text-slate-50">
                {String(index + 1)}. {question.prompt}
              </legend>

              {isShortAnswer ? (
                <ShortAnswerTextarea
                  questionId={question.id}
                  value={questionTextAnswer}
                  disabled={checked}
                  placeholder={copy.textAnswerPlaceholder}
                  onChange={(value) => {
                    handleTextChange(question.id, value);
                  }}
                />
              ) : isFillInTheBlank ? (
                <TextAnswerInput
                  questionId={question.id}
                  value={questionTextAnswer}
                  disabled={checked}
                  placeholder={copy.textAnswerPlaceholder}
                  onChange={(value) => {
                    handleTextChange(question.id, value);
                  }}
                />
              ) : isOrdering ? (
                <>
                  <p className="mt-3 text-sm font-medium text-brand-700 dark:text-brand-300">
                    {copy.orderingHint}
                  </p>
                  <OrderingAnswerList
                    questionId={question.id}
                    answers={questionOrderingAnswers}
                    disabled={checked}
                    moveDownLabel={copy.orderingMoveDown}
                    moveUpLabel={copy.orderingMoveUp}
                    onMove={(answerIndex, direction) => {
                      handleOrderingMove(
                        question.id,
                        questionOrderingAnswerIds,
                        answerIndex,
                        direction,
                      );
                    }}
                  />
                </>
              ) : isMatching ? (
                <>
                  <p className="mt-3 text-sm font-medium text-brand-700 dark:text-brand-300">
                    {copy.matchingHint}
                  </p>
                  <MatchingAnswerList
                    questionId={question.id}
                    answers={question.answers}
                    selectedMatches={questionMatchingAnswers}
                    disabled={checked}
                    placeholder={copy.matchingSelectPlaceholder}
                    onSelect={(leftId, rightId) => {
                      handleMatchSelect(question.id, leftId, rightId);
                    }}
                  />
                </>
              ) : isMulti ? (
                <CheckboxAnswerList
                  questionId={question.id}
                  answers={question.answers}
                  selectedAnswerIds={questionSelectedAnswerIds}
                  disabled={checked}
                  onToggle={(answerId) => {
                    handleToggle(question.id, answerId);
                  }}
                />
              ) : isTrueFalse ? (
                <TrueFalseButtons
                  questionId={question.id}
                  answers={question.answers}
                  selectedAnswerId={selectedAnswerId}
                  disabled={checked}
                  onSelect={(answerId) => {
                    handleSelect(question.id, answerId);
                  }}
                />
              ) : (
                <RadioAnswerList
                  questionId={question.id}
                  answers={question.answers}
                  selectedAnswerId={selectedAnswerId}
                  disabled={checked}
                  onSelect={(answerId) => {
                    handleSelect(question.id, answerId);
                  }}
                />
              )}

              {checked &&
              (isAssociationAnswer
                ? isMatching
                  ? hasMatchingAnswer
                  : hasOrderingAnswer
                : isTextAnswer
                  ? questionTextAnswer.trim().length > 0
                  : questionSelectedAnswerIds.length > 0) ? (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                    isAssociationAnswer
                      ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      : isCorrect
                        ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-900 dark:bg-success-950/20 dark:text-success-500'
                        : 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900 dark:bg-warning-950/20 dark:text-warning-500'
                  }`}
                >
                  {isAssociationAnswer ? null : (
                    <p className="font-semibold">{isCorrect ? copy.correct : copy.incorrect}</p>
                  )}
                  {feedbackText ? (
                    <p className={isAssociationAnswer ? '' : 'mt-1'}>{feedbackText}</p>
                  ) : null}
                  {isTextAnswer && correctAnswerLabels.length > 0 ? (
                    <p className="mt-2">
                      <span className="font-semibold">{copy.correct} : </span>
                      {correctAnswerLabels.join(', ')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="primary" size="md" onClick={check}>
          {copy.check}
        </Button>
        {checked ? (
          <Button type="button" variant="ghost" size="md" onClick={retry}>
            {copy.retry}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function sameAnswerSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length === 0 || left.length !== right.length) return false;
  if (new Set(left).size !== left.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function getMatchingAnswerGroups(answers: readonly MatchingAnswerOption[]): {
  readonly leftAnswers: readonly MatchingAnswerOption[];
  readonly rightAnswers: readonly MatchingAnswerOption[];
} {
  const leftAnswers = answers.filter(
    (answer) => typeof answer.pairId === 'string' && answer.pairId.length > 0,
  );
  const answersById = new Map(answers.map((answer) => [answer.id, answer]));
  const rightAnswerIds = Array.from(new Set(leftAnswers.map((answer) => answer.pairId ?? '')));
  const rightAnswers = rightAnswerIds.map(
    (answerId) => answersById.get(answerId) ?? { id: answerId, label: answerId },
  );

  return { leftAnswers, rightAnswers };
}

function isMatchingComplete(
  answers: readonly MatchingAnswerOption[],
  selectedMatches: Readonly<Record<string, string>>,
): boolean {
  const { leftAnswers } = getMatchingAnswerGroups(answers);
  return (
    leftAnswers.length > 0 &&
    leftAnswers.every((leftAnswer) => (selectedMatches[leftAnswer.id] ?? '').trim().length > 0)
  );
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

function isOrderingComplete(
  answers: readonly MatchingAnswerOption[],
  storedAnswerIds: readonly string[] | undefined,
): boolean {
  const orderingAnswerIds = getOrderingAnswerIds(answers, storedAnswerIds);
  return answers.length > 0 && orderingAnswerIds.length === answers.length;
}

function moveAnswerId(
  answerIds: readonly string[],
  index: number,
  direction: -1 | 1,
): readonly string[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= answerIds.length) return answerIds;

  const nextAnswerIds = [...answerIds];
  [nextAnswerIds[index], nextAnswerIds[targetIndex]] = [
    nextAnswerIds[targetIndex],
    nextAnswerIds[index],
  ];
  return nextAnswerIds;
}

function firstNonEmptyText(...values: readonly (string | undefined)[]): string {
  return values.find((value) => value !== undefined && value.length > 0) ?? '';
}
