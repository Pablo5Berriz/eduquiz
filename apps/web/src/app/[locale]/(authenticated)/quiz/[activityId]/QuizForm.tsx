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
  readonly points: number;
  readonly answers: readonly {
    readonly id: string;
    readonly label: string;
  }[];
}

export interface QuizFormCopy {
  readonly submit: string;
  readonly submitting: string;
  readonly points: string;
  readonly multiSelectHint: string;
  readonly fillBlankHint: string;
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

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextResult = await submitQuizAttempt(formData);
      setResult(nextResult);
    });
  }

  const missingQuestionIds = new Set(!result.ok ? (result.missingQuestionIds ?? []) : []);
  const formError = !result.ok ? copy.errors[result.error] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={startedAt} />

      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      {questions.map((question, index) => {
        const hasError = missingQuestionIds.has(question.id);
        const isFillInTheBlank = question.type === 'FILL_IN_THE_BLANK';
        const inputType = question.type === 'MCQ_MULTI' ? 'checkbox' : 'radio';

        return (
          <fieldset
            key={question.id}
            aria-invalid={hasError}
            className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <legend className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              {index + 1}. {question.prompt}
            </legend>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {String(question.points)} {copy.points}
            </p>
            {question.type === 'MCQ_MULTI' ? (
              <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                {copy.multiSelectHint}
              </p>
            ) : null}
            {isFillInTheBlank ? (
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

      <Button type="submit" variant="primary" size="lg" isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
