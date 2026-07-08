'use client';

/**
 * Formulaire client — saisie du code de rattachement parent (Tâche 2.2).
 *
 * Affiché post-login pour les mineurs sans parent rattaché.
 * Appelle `redeemParentCode` et affiche le message de succès ou l'erreur.
 */

import { Alert, Button, FormField, Input } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { redeemParentCode, type RedeemErrorCode } from '../../../../../lib/family/actions';

import type { JSX } from 'react';

export interface LinkParentFormCopy {
  readonly codeLabel: string;
  readonly codeHint: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly skipCta: string;
  readonly errors: Record<RedeemErrorCode, string>;
}

export interface LinkParentFormProps {
  readonly locale: 'fr' | 'en';
  readonly copy: LinkParentFormCopy;
  readonly skipHref: string;
}

export function LinkParentForm({ locale, copy, skipHref }: LinkParentFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [code, setCode] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await redeemParentCode(code, locale);
      if (result.ok) {
        setSucceeded(true);
        setTimeout(() => {
          router.push(skipHref);
        }, 2000);
        return;
      }
      setError(copy.errors[result.error]);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {succeeded ? (
        <Alert tone="success">{copy.success}</Alert>
      ) : (
        <>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField id="inviteCode" label={copy.codeLabel} hint={copy.codeHint} required>
            <Input
              id="inviteCode"
              name="inviteCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              invalid={!!error}
            />
          </FormField>

          <Button type="submit" variant="primary" size="lg" isLoading={pending}>
            {pending ? copy.submitting : copy.submit}
          </Button>
        </>
      )}

      <a
        href={skipHref}
        className="text-center text-sm font-medium text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {copy.skipCta}
      </a>
    </form>
  );
}
