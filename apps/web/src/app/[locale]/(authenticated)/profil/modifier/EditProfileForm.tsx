'use client';

/**
 * Formulaire client d'édition de profil (écran 30).
 *
 * Champs : firstName, lastName, displayName, currentGrade (select),
 * preferredLocale (select), avatarUrl. Soumet la Server Action
 * `updateProfile`. Affiche les erreurs Zod par champ.
 */

import { Alert, Button, FormField, Input } from '@eduquiz/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  updateProfile,
  type UpdateProfileFieldErrorCode,
  type UpdateProfileInput,
} from '../../../../../lib/auth/actions/account';

import type { JSX } from 'react';

type ErrorMap = Record<UpdateProfileFieldErrorCode, string>;

export interface EditProfileInitial {
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly currentGrade: string;
  readonly preferredLocale: 'FR' | 'EN';
  readonly avatarUrl: string;
}

export interface EditProfileFormCopy {
  readonly fields: {
    readonly firstName: string;
    readonly lastName: string;
    readonly displayName: string;
    readonly currentGrade: string;
    readonly preferredLocale: string;
    readonly avatarUrl: string;
    readonly firstNameHint: string;
    readonly lastNameHint: string;
    readonly displayNameHint: string;
    readonly currentGradeHint: string;
    readonly preferredLocaleHint: string;
    readonly avatarUrlHint: string;
  };
  readonly localeOptions: { fr: string; en: string };
  readonly submit: string;
  readonly submitting: string;
  readonly cancel: string;
  readonly success: string;
  readonly errors: ErrorMap;
}

export interface EditProfileFormProps {
  readonly locale: 'fr' | 'en';
  readonly initial: EditProfileInitial;
  readonly copy: EditProfileFormCopy;
}

const GRADE_OPTIONS = ['', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5'] as const;

export function EditProfileForm({ locale, initial, copy }: EditProfileFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, UpdateProfileFieldErrorCode>>>({});
  const [success, setSuccess] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const input: UpdateProfileInput = {
      firstName: String(fd.get('firstName') ?? ''),
      lastName: String(fd.get('lastName') ?? ''),
      displayName: String(fd.get('displayName') ?? ''),
      currentGrade: String(fd.get('currentGrade') ?? '') as UpdateProfileInput['currentGrade'],
      preferredLocale: String(fd.get('preferredLocale') ?? 'FR') as 'FR' | 'EN',
      avatarUrl: String(fd.get('avatarUrl') ?? ''),
    };
    startTransition(async () => {
      const result = await updateProfile(input);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
        return;
      }
      setErrors(result.fieldErrors as Record<string, UpdateProfileFieldErrorCode>);
    });
  }

  const formError = errors.form ? copy.errors[errors.form] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {success ? <Alert tone="success">{copy.success}</Alert> : null}
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="firstName"
          label={copy.fields.firstName}
          hint={copy.fields.firstNameHint}
          error={errors.firstName ? copy.errors[errors.firstName] : undefined}
        >
          <Input
            id="firstName"
            name="firstName"
            defaultValue={initial.firstName}
            maxLength={80}
            invalid={!!errors.firstName}
          />
        </FormField>

        <FormField
          id="lastName"
          label={copy.fields.lastName}
          hint={copy.fields.lastNameHint}
          error={errors.lastName ? copy.errors[errors.lastName] : undefined}
        >
          <Input
            id="lastName"
            name="lastName"
            defaultValue={initial.lastName}
            maxLength={80}
            invalid={!!errors.lastName}
          />
        </FormField>
      </div>

      <FormField
        id="displayName"
        label={copy.fields.displayName}
        hint={copy.fields.displayNameHint}
        error={errors.displayName ? copy.errors[errors.displayName] : undefined}
      >
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initial.displayName}
          maxLength={60}
          invalid={!!errors.displayName}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="currentGrade"
          label={copy.fields.currentGrade}
          hint={copy.fields.currentGradeHint}
          error={errors.currentGrade ? copy.errors[errors.currentGrade] : undefined}
        >
          <select
            id="currentGrade"
            name="currentGrade"
            defaultValue={initial.currentGrade}
            className="block w-full min-h-touch-min rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g || 'none'} value={g}>
                {g || '—'}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="preferredLocale"
          label={copy.fields.preferredLocale}
          hint={copy.fields.preferredLocaleHint}
          error={errors.preferredLocale ? copy.errors[errors.preferredLocale] : undefined}
        >
          <select
            id="preferredLocale"
            name="preferredLocale"
            defaultValue={initial.preferredLocale}
            className="block w-full min-h-touch-min rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="FR">{copy.localeOptions.fr}</option>
            <option value="EN">{copy.localeOptions.en}</option>
          </select>
        </FormField>
      </div>

      <FormField
        id="avatarUrl"
        label={copy.fields.avatarUrl}
        hint={copy.fields.avatarUrlHint}
        error={errors.avatarUrl ? copy.errors[errors.avatarUrl] : undefined}
      >
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={initial.avatarUrl}
          maxLength={2048}
          invalid={!!errors.avatarUrl}
          placeholder="https://…"
        />
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" size="lg" isLoading={pending}>
          {pending ? copy.submitting : copy.submit}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(`/${locale}/profil`)}
        >
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}
