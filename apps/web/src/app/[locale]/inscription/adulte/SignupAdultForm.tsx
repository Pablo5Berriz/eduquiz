'use client';

/**
 * Formulaire client d'inscription adulte (écran 19).
 *
 * - useTransition pour montrer l'état submit
 * - Validation côté serveur uniquement (Server Action `registerAdult`)
 * - Affichage des erreurs par champ via i18n
 * - Redirection programmatique vers /verification-email après succès
 *
 * Les boutons OAuth sont rendus par le parent Server Component
 * (lecture conditionnelle de `getAuthEnv` côté serveur), pas ici.
 */

import { Button, Checkbox, FormField, Input, PasswordInput } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  registerAdult,
  type RegisterAdultResult,
  type SignupFieldErrorCode,
} from '../../../../lib/auth/actions/register';

import type { JSX, ReactNode } from 'react';

export interface SignupAdultFormCopy {
  readonly emailLabel: string;
  readonly emailHint: string;
  readonly passwordLabel: string;
  readonly passwordHint: string;
  readonly birthDateLabel: string;
  readonly birthDateHint: string;
  readonly termsLabel: ReactNode;
  readonly marketingLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly errors: Record<SignupFieldErrorCode, string>;
}

export interface SignupAdultFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: SignupAdultFormCopy;
}

export function SignupAdultForm({ locale, copy }: SignupAdultFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, SignupFieldErrorCode>>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      locale,
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
      birthDate: String(fd.get('birthDate') ?? ''),
      acceptTerms: fd.get('acceptTerms') === 'on',
      acceptMarketing: fd.get('acceptMarketing') === 'on',
    };
    startTransition(async () => {
      const result: RegisterAdultResult = await registerAdult(input);
      if (result.ok) {
        const url = `/${locale}/verification-email?email=${encodeURIComponent(result.email)}`;
        router.push(url);
        return;
      }
      setErrors(result.fieldErrors as Record<string, SignupFieldErrorCode>);
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

      <Checkbox name="acceptMarketing">{copy.marketingLabel}</Checkbox>

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
