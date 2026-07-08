'use client';

/**
 * Formulaire client de préférence de langue. Soumet la Server Action
 * `updateLocale` puis recharge la page (le cookie `NEXT_LOCALE` n'est
 * pas modifié — la prochaine navigation respectera l'URL préfixée).
 */

import { Alert, Button } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { updateLocale } from '../../../../../lib/auth/actions/account';

import type { JSX } from 'react';

export interface LanguageFormCopy {
  readonly currentLabel: string;
  readonly optionFr: string;
  readonly optionEn: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
}

export interface LanguageFormProps {
  readonly initialLocale: 'FR' | 'EN';
  readonly copy: LanguageFormCopy;
}

export function LanguageForm({ initialLocale, copy }: LanguageFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [value, setValue] = useState<'FR' | 'EN'>(initialLocale);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSuccess(false);
    startTransition(async () => {
      const result = await updateLocale({ locale: value });
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {success ? <Alert tone="success">{copy.success}</Alert> : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {copy.currentLabel}
        </legend>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
          <input
            type="radio"
            name="locale"
            value="FR"
            checked={value === 'FR'}
            onChange={() => { setValue('FR'); }}
            className="h-5 w-5"
          />
          <span>{copy.optionFr}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
          <input
            type="radio"
            name="locale"
            value="EN"
            checked={value === 'EN'}
            onChange={() => { setValue('EN'); }}
            className="h-5 w-5"
          />
          <span>{copy.optionEn}</span>
        </label>
      </fieldset>

      <Button type="submit" variant="primary" size="md" isLoading={pending}>
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
