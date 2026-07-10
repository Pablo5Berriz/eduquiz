'use client';

/**
 * Formulaire client de changement de mot de passe (sous-écran de 32).
 *
 * Soumet la Server Action `changePassword`. Le succès invalide toutes
 * les sessions, y compris la courante : on redirige vers /connexion?
 * session=expired pour clarté.
 */

import { Alert, Button, FormField, PasswordInput } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  changePassword,
  type ChangePasswordFieldErrorCode,
} from '../../../../../lib/auth/actions/account';

import type { JSX } from 'react';

export interface ChangePasswordFormCopy {
  readonly currentLabel: string;
  readonly newLabel: string;
  readonly newHint: string;
  readonly confirmLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly errors: Record<ChangePasswordFieldErrorCode, string>;
}

export interface ChangePasswordFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: ChangePasswordFormCopy;
}

function formString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function ChangePasswordForm({ locale, copy }: ChangePasswordFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, ChangePasswordFieldErrorCode>>>({});
  const [success, setSuccess] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const input = {
      currentPassword: formString(fd, 'currentPassword'),
      newPassword: formString(fd, 'newPassword'),
      confirmPassword: formString(fd, 'confirmPassword'),
    };
    startTransition(async () => {
      const result = await changePassword(input);
      if (result.ok) {
        setSuccess(true);
        // Toutes les sessions ayant été invalidées (y compris la
        // courante), on renvoie vers la connexion avec un drapeau
        // explicite pour expliquer la déconnexion.
        setTimeout(() => {
          router.push(`/${locale}/connexion?session=expired`);
        }, 800);
        return;
      }
      setErrors(result.fieldErrors as Record<string, ChangePasswordFieldErrorCode>);
    });
  }

  const formError = errors.form ? copy.errors[errors.form] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {success ? <Alert tone="success">{copy.success}</Alert> : null}
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <FormField
        id="currentPassword"
        label={copy.currentLabel}
        error={errors.currentPassword ? copy.errors[errors.currentPassword] : undefined}
        required
      >
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          invalid={!!errors.currentPassword}
        />
      </FormField>

      <FormField
        id="newPassword"
        label={copy.newLabel}
        hint={copy.newHint}
        error={errors.newPassword ? copy.errors[errors.newPassword] : undefined}
        required
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={8}
          required
          invalid={!!errors.newPassword}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label={copy.confirmLabel}
        error={errors.confirmPassword ? copy.errors[errors.confirmPassword] : undefined}
        required
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          invalid={!!errors.confirmPassword}
        />
      </FormField>

      <Button type="submit" variant="primary" size="lg" isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
