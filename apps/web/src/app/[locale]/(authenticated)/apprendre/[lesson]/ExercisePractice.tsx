'use client';

import { Alert, Button } from '@eduquiz/ui';
import { useState } from 'react';

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

// ── Composant principal ───────────────────────────────────────────────────────

export function ExercisePractice({ exercise, copy }: ExercisePracticeProps): JSX.Element {
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<Record<string, readonly string[]>>({});
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

  function check(): void {
    const complete = exercise.questions.every((question) => selectedAnswerIds[question.id]?.length);
    setShowIncomplete(!complete);
    setChecked(complete);
  }

  function retry(): void {
    setSelectedAnswerIds({});
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
          const isCorrect = isMulti
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

              {isMulti ? (
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

              {checked && questionSelectedAnswerIds.length > 0 ? (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                    isCorrect
                      ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-900 dark:bg-success-950/20 dark:text-success-500'
                      : 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900 dark:bg-warning-950/20 dark:text-warning-500'
                  }`}
                >
                  <p className="font-semibold">{isCorrect ? copy.correct : copy.incorrect}</p>
                  <p className="mt-1">{feedbackText}</p>
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

function firstNonEmptyText(...values: readonly (string | undefined)[]): string {
  return values.find((value) => value !== undefined && value.length > 0) ?? '';
}
