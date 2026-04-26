'use client';

/**
 * Formulaire client de suppression de compte (écran 38).
 *
 * Exige :
 *   - mot de passe actuel
 *   - texte de confirmation égal au mot exigé (`expectedWord`, traduit
 *     côté serveur — passé en prop pour ne pas hardcoder côté client)
 *
 * Sur succès : redirige vers la home avec `?disabled=1` (les sessions
 * sont déjà fermées par la Server Action).
 */

import { Alert, Button, FormField, Input, PasswordInput } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  requestAccountDeletion,
  type DeletionFieldErrorCode,
} from '../../../../../../lib/auth/actions/account';

import type { JSX } from 'react';

export interface DeleteAccountFormCopy {
  readonly passwordLabel: string;
  readonly confirmInstruction: string;
  readonly confirmWord: string;
  readonly confirmPlaceholder: string;
  readonly submit: string;
  readonly submitting: string;
  readonly cancel: string;
  readonly success: string;
  readonly errors: Record<DeletionFieldErrorCode, string>;
}

export interface DeleteAccountFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: DeleteAccountFormCopy;
}

export function DeleteAccountForm({ locale, copy }: DeleteAccountFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, DeletionFieldErrorCode>>>({});
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const input = {
      password: String(fd.get('password') ?? ''),
      confirmText: String(fd.get('confirmText') ?? ''),
      expectedWord: copy.confirmWord,
    };
    startTransition(async () => {
      const result = await requestAccountDeletion(input);
      if (result.ok) {
        setDone(true);
        setTimeout(() => router.push(`/${locale}/?disabled=1`), 1200);
        return;
      }
      setErrors(result.fieldErrors as Record<string, DeletionFieldErrorCode>);
    });
  }

  if (done) {
    return <Alert tone="success">{copy.success}</Alert>;
  }

  const formError = errors.form ? copy.errors[errors.form] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <p className="text-sm text-slate-700 dark:text-slate-200">
        {copy.confirmInstruction}{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
          {copy.confirmWord}
        </code>
      </p>

      <FormField
        id="confirmText"
        label={copy.confirmInstruction}
        error={errors.confirmText ? copy.errors[errors.confirmText] : undefined}
        required
      >
        <Input
          id="confirmText"
          name="confirmText"
          type="text"
          required
          autoComplete="off"
          placeholder={copy.confirmPlaceholder}
          invalid={!!errors.confirmText}
        />
      </FormField>

      <FormField
        id="password"
        label={copy.passwordLabel}
        error={errors.password ? copy.errors[errors.password] : undefined}
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          invalid={!!errors.password}
        />
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="danger" size="lg" isLoading={pending}>
          {pending ? copy.submitting : copy.submit}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(`/${locale}/parametres`)}
        >
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}
