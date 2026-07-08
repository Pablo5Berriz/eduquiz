'use client';

/**
 * Formulaire client d'inscription élève mineur.
 *
 * Identique dans sa structure à `SignupAdultForm`, sans le champ
 * marketing (interdit pour les mineurs — Loi 25).
 */

import { Button, Checkbox, FormField, Input, PasswordInput } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  registerMinor,
  type RegisterMinorResult,
  type SignupMinorFieldErrorCode,
} from '../../../../lib/auth/actions/register';

import type { JSX, ReactNode } from 'react';

export interface SignupMinorFormCopy {
  readonly emailLabel: string;
  readonly emailHint: string;
  readonly passwordLabel: string;
  readonly passwordHint: string;
  readonly birthDateLabel: string;
  readonly birthDateHint: string;
  readonly termsLabel: ReactNode;
  readonly submit: string;
  readonly submitting: string;
  readonly errors: Record<SignupMinorFieldErrorCode, string>;
}

export interface SignupMinorFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: SignupMinorFormCopy;
}

function formString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function SignupMinorForm({ locale, copy }: SignupMinorFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, SignupMinorFieldErrorCode>>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      locale,
      email: formString(fd, 'email'),
      password: formString(fd, 'password'),
      birthDate: formString(fd, 'birthDate'),
      acceptTerms: fd.get('acceptTerms') === 'on',
    };
    startTransition(async () => {
      const result: RegisterMinorResult = await registerMinor(input);
      if (result.ok) {
        const url = `/${locale}/verification-email?email=${encodeURIComponent(result.email)}`;
        router.push(url);
        return;
      }
      setErrors(result.fieldErrors as Record<string, SignupMinorFieldErrorCode>);
    });
  }

  const formError = errors.form ? copy.errors[errors.form] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormField
        id="email"
        label={copy.emailLabel}
        hint={copy.emailHint}
        error={errors.email ? copy.errors[errors.email] : undefined}
        required
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={!!errors.email}
          aria-describedby={`email-hint${errors.email ? ' email-error' : ''}`}
        />
      </FormField>

      <FormField
        id="password"
        label={copy.passwordLabel}
        hint={copy.passwordHint}
        error={errors.password ? copy.errors[errors.password] : undefined}
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          invalid={!!errors.password}
          minLength={8}
          aria-describedby={`password-hint${errors.password ? ' password-error' : ''}`}
        />
      </FormField>

      <FormField
        id="birthDate"
        label={copy.birthDateLabel}
        hint={copy.birthDateHint}
        error={errors.birthDate ? copy.errors[errors.birthDate] : undefined}
        required
      >
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          invalid={!!errors.birthDate}
          aria-describedby={`birthDate-hint${errors.birthDate ? ' birthDate-error' : ''}`}
        />
      </FormField>

      <Checkbox
        name="acceptTerms"
        required
        invalid={!!errors.acceptTerms}
        aria-invalid={!!errors.acceptTerms}
      >
        {copy.termsLabel}
        {errors.acceptTerms ? (
          <span role="alert" className="mt-1 block text-xs font-medium text-danger-700 dark:text-danger-300">
            {copy.errors[errors.acceptTerms]}
          </span>
        ) : null}
      </Checkbox>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-300"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
