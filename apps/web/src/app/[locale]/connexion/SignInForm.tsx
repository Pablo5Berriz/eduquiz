'use client';

/**
 * Formulaire client de connexion (écran 16).
 *
 * Pattern Auth.js v5 : la Server Action `signInAdult` redirige
 * automatiquement en cas de succès (jamais on n'observe `ok: true`
 * côté client). En cas d'échec, elle retourne `{ ok: false, code }`
 * qu'on convertit en message via la table `errors`.
 */

import { Alert, Button, FormField, Input, PasswordInput } from '@eduquiz/ui';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { signInAdult, type SignInErrorCode } from '../../../lib/auth/actions/signin';

import type { JSX } from 'react';

export interface SignInFormCopy {
  readonly emailLabel: string;
  readonly passwordLabel: string;
  readonly forgotPassword: string;
  readonly submit: string;
  readonly submitting: string;
  readonly errors: Record<SignInErrorCode, string>;
}

export interface SignInFormProps {
  readonly locale: 'fr' | 'en';
  readonly nextPath: string | null;
  readonly copy: SignInFormCopy;
}

function formString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function SignInForm({ locale, nextPath, copy }: SignInFormProps): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<SignInErrorCode | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const input = {
      locale,
      email: formString(fd, 'email'),
      password: formString(fd, 'password'),
      nextPath,
    };
    startTransition(async () => {
      const result = await signInAdult(input);
      if (!result.ok) setError(result.code);
      // Si ok, le redirect Auth.js a déjà été propagé par la Server
      // Action — on ne retombe jamais ici dans le cas nominal.
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert tone="danger" title={null}>
          {copy.errors[error]}
        </Alert>
      ) : null}

      <FormField id="email" label={copy.emailLabel} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
        />
      </FormField>

      <FormField
        id="password"
        label={
          <span className="flex items-center justify-between gap-3">
            <span>{copy.passwordLabel}</span>
            <Link
              href={`/${locale}/mot-de-passe-oublie`}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300"
            >
              {copy.forgotPassword}
            </Link>
          </span>
        }
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </FormField>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
