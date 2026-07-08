'use client';

/**
 * Formulaire client « mot de passe oublié » (écran 17).
 *
 * Anti-énumération : la Server Action retourne toujours `ok:true` si
 * l'email est bien formé. On n'a donc qu'un seul état de succès UI :
 * « si un compte existe, un lien a été envoyé ».
 */

import { Alert, Button, FormField, Input } from '@eduquiz/ui';
import { useState, useTransition } from 'react';

import { requestPasswordReset } from '../../../lib/auth/actions/forgot-password';

import type { JSX } from 'react';

export interface ForgotPasswordFormCopy {
  readonly emailLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly sentTitle: string;
  readonly sentBody: string;
  readonly errors: { readonly emailInvalid: string; readonly unknown: string };
}

export interface ForgotPasswordFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: ForgotPasswordFormCopy;
}

function formString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function ForgotPasswordForm({ locale, copy }: ForgotPasswordFormProps): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<'emailInvalid' | 'unknown' | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = formString(fd, 'email');
    startTransition(async () => {
      const result = await requestPasswordReset({ locale, email });
      if (result.ok) {
        setSent(true);
        return;
      }
      setError(result.fieldErrors.email ?? 'unknown');
    });
  }

  if (sent) {
    return (
      <Alert tone="success" title={copy.sentTitle}>
        {copy.sentBody}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormField
        id="email"
        label={copy.emailLabel}
        error={error ? copy.errors[error] : undefined}
        required
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          invalid={!!error}
        />
      </FormField>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
