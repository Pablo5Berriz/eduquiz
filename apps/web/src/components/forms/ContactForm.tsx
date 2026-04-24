'use client';

import { Button, Card } from '@eduquiz/ui';
import { useId, useState, type FormEvent, type JSX } from 'react';

/**
 * Formulaire de contact (client).
 *
 * Gère l'état du formulaire côté client, valide localement les champs
 * avant d'appeler l'endpoint `POST /api/contact`. Les libellés et
 * messages sont passés en props pour que la page parent reste Server
 * Component et fournisse les textes traduits.
 */

export interface ContactFormLabels {
  readonly nameLabel: string;
  readonly namePlaceholder: string;
  readonly emailLabel: string;
  readonly emailPlaceholder: string;
  readonly topicLabel: string;
  readonly topicOptions: readonly { readonly value: string; readonly label: string }[];
  readonly messageLabel: string;
  readonly messagePlaceholder: string;
  readonly submitLabel: string;
  readonly sendingLabel: string;
  readonly successTitle: string;
  readonly successDescription: string;
  readonly errorGeneric: string;
  readonly errorEmail: string;
  readonly errorRequired: string;
  readonly errorMessageTooShort: string;
}

interface FormState {
  readonly name: string;
  readonly email: string;
  readonly topic: string;
  readonly message: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ labels }: { labels: ContactFormLabels }): JSX.Element {
  const nameId = useId();
  const emailId = useId();
  const topicId = useId();
  const messageId = useId();
  const errorId = useId();

  const [state, setState] = useState<FormState>({
    name: '',
    email: '',
    topic: labels.topicOptions[0]?.value ?? 'general',
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!state.name.trim()) return labels.errorRequired;
    if (!state.email.trim()) return labels.errorRequired;
    if (!EMAIL_RE.test(state.email.trim())) return labels.errorEmail;
    if (state.message.trim().length < 10) return labels.errorMessageTooShort;
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}`);
      }
      setStatus('success');
      setState({
        name: '',
        email: '',
        topic: labels.topicOptions[0]?.value ?? 'general',
        message: '',
      });
    } catch {
      setStatus('error');
      setError(labels.errorGeneric);
    }
  }

  if (status === 'success') {
    return (
      <Card variant="accent" padding="lg" role="status" aria-live="polite">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {labels.successTitle}
        </h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {labels.successDescription}
        </p>
      </Card>
    );
  }

  const isSubmitting = status === 'submitting';

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {labels.nameLabel}
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder={labels.namePlaceholder}
          value={state.name}
          onChange={(e) => {
            update('name', e.target.value);
          }}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {labels.emailLabel}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={labels.emailPlaceholder}
          value={state.email}
          onChange={(e) => {
            update('email', e.target.value);
          }}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={topicId} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {labels.topicLabel}
        </label>
        <select
          id={topicId}
          name="topic"
          value={state.topic}
          onChange={(e) => {
            update('topic', e.target.value);
          }}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {labels.topicOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={messageId}
          className="text-sm font-semibold text-slate-800 dark:text-slate-100"
        >
          {labels.messageLabel}
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={6}
          placeholder={labels.messagePlaceholder}
          value={state.message}
          onChange={(e) => {
            update('message', e.target.value);
          }}
          disabled={isSubmitting}
          aria-describedby={error ? errorId : undefined}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? labels.sendingLabel : labels.submitLabel}
      </Button>
    </form>
  );
}
