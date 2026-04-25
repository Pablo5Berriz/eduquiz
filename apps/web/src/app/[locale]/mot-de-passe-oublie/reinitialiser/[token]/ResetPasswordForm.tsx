'use client';

/**
 * Formulaire client de réinitialisation de mot de passe (écran 18).
 *
 * Le token est passé en prop (lu côté Server Component depuis l'URL).
 * Soumission → `completePasswordReset` → succès affiche un message
 * et un CTA vers `/connexion?reset=1`.
 */

import { Alert, Button, FormField, PasswordInput } from '@eduquiz/ui';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import {
  completePasswordReset,
  type PasswordResetFieldErrorCode,
} from '../../../../../lib/auth/actions/forgot-password';

import type { JSX } from 'react';

export interface ResetPasswordFormCopy {
  readonly newPasswordLabel: string;
  readonly newPasswordHint: string;
  readonly confirmPasswordLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly successTitle: string;
  readonly successBody: string;
  readonly successCta: string;
  readonly errors: Record<PasswordResetFieldErrorCode, string>;
}

export interface ResetPasswordFormProps {
  readonly locale: 'fr' | 'en';
  readonly token: string;
  readonly copy: ResetPasswordFormCopy;
}

export function ResetPasswordForm({ locale, token, copy }: ResetPasswordFormProps): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, PasswordResetFieldErrorCode>>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const input = {
      token,
      newPassword: String(fd.get('newPassword') ?? ''),
      confirmPassword: String(fd.get('confirmPassword') ?? ''),
    };
    startTransition(async () => {
      const result = await completePasswordReset(input);
      if (result.ok) {
        setDone(true);
        return;
      }
      setErrors(result.fieldErrors as Record<string, PasswordResetFieldErrorCode>);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success" title={copy.successTitle}>
          {copy.successBody}
        </Alert>
        <Link href={`/${locale}/connexion?reset=1`} className="inline-flex">
          <Button variant="primary" size="lg" fullWidth>
            {copy.successCta}
          </Button>
        </Link>
      </div>
    );
  }

  const formError = errors.form ? copy.errors[errors.form] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <FormField
        id="newPassword"
        label={copy.newPasswordLabel}
        hint={copy.newPasswordHint}
        error={errors.newPassword ? copy.errors[errors.newPassword] : undefined}
        required
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          invalid={!!errors.newPassword}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label={copy.confirmPasswordLabel}
        error={errors.confirmPassword ? copy.errors[errors.confirmPassword] : undefined}
        required
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          invalid={!!errors.confirmPassword}
        />
      </FormField>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
