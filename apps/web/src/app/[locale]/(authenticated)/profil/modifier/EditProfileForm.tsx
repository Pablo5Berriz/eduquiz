'use client';

/**
 * Formulaire client d'édition de profil (écran 30).
 *
 * Champs : firstName, lastName, displayName, currentGrade (select),
 * preferredLocale (select), avatar (picker visuel DiceBear).
 * Soumet la Server Action `updateProfile`.
 */

import { Alert, Avatar, Button, FormField, Input } from '@eduquiz/ui';
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
  /** URL to redirect to after a successful save. Defaults to /<locale> */
  readonly redirectTo?: string;
}

/** Niveaux scolaires avec libellé complet */
const GRADE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '—' },
  { value: 'P3', label: 'Primaire 3' },
  { value: 'P4', label: 'Primaire 4' },
  { value: 'P5', label: 'Primaire 5' },
  { value: 'P6', label: 'Primaire 6' },
  { value: 'S1', label: 'Secondaire 1' },
  { value: 'S2', label: 'Secondaire 2' },
  { value: 'S3', label: 'Secondaire 3' },
  { value: 'S4', label: 'Secondaire 4' },
  { value: 'S5', label: 'Secondaire 5' },
];

/** ─── Avatar picker avec DiceBear ─────────────────────────────────────────
 *
 * DiceBear (https://www.dicebear.com) — bibliothèque open-source, gratuite,
 * sans clé API. Les URL SVG sont stables et peuvent être stockées directement
 * dans la base de données.
 *
 * Styles utilisés :
 *   • avataaars    → avatars cartoonesques humains
 *   • pixel-art    → style pixel art rétro
 *   • fun-emoji    → emoji expressifs
 *   • bottts       → robots sympathiques
 */
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x';

interface AvatarOption {
  url: string;
  label: string;
}

function dicebear(style: string, seed: string): string {
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Avataaars — humains cartoonesques
  { url: dicebear('avataaars', 'Luna'),    label: 'Luna' },
  { url: dicebear('avataaars', 'Felix'),   label: 'Felix' },
  { url: dicebear('avataaars', 'Mila'),    label: 'Mila' },
  { url: dicebear('avataaars', 'Noah'),    label: 'Noah' },
  { url: dicebear('avataaars', 'Sofia'),   label: 'Sofia' },
  { url: dicebear('avataaars', 'Ethan'),   label: 'Ethan' },
  // Pixel art — style rétro
  { url: dicebear('pixel-art', 'Star'),    label: 'Star' },
  { url: dicebear('pixel-art', 'Comet'),   label: 'Comet' },
  { url: dicebear('pixel-art', 'Nova'),    label: 'Nova' },
  { url: dicebear('pixel-art', 'Blaze'),   label: 'Blaze' },
  { url: dicebear('pixel-art', 'Storm'),   label: 'Storm' },
  { url: dicebear('pixel-art', 'Frost'),   label: 'Frost' },
  // Fun emoji
  { url: dicebear('fun-emoji', 'Happy'),   label: 'Happy' },
  { url: dicebear('fun-emoji', 'Champ'),   label: 'Champ' },
  { url: dicebear('fun-emoji', 'Sunny'),   label: 'Sunny' },
  { url: dicebear('fun-emoji', 'Sage'),    label: 'Sage' },
  { url: dicebear('fun-emoji', 'Spark'),   label: 'Spark' },
  { url: dicebear('fun-emoji', 'Breeze'),  label: 'Breeze' },
  // Bottts — robots
  { url: dicebear('bottts', 'R2'),         label: 'R2' },
  { url: dicebear('bottts', 'Axiom'),      label: 'Axiom' },
  { url: dicebear('bottts', 'Zephyr'),     label: 'Zephyr' },
  { url: dicebear('bottts', 'Pixel'),      label: 'Pixel' },
  { url: dicebear('bottts', 'Volt'),       label: 'Volt' },
  { url: dicebear('bottts', 'Nano'),       label: 'Nano' },
];

interface AvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  displayName: string;
  label: string;
}

function AvatarPicker({ value, onChange, displayName, label }: AvatarPickerProps): JSX.Element {
  const isPreset = AVATAR_OPTIONS.some((a) => a.url === value);
  const [showCustom, setShowCustom] = useState(!isPreset && value.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Preview */}
      <div className="flex items-center gap-3">
        <Avatar src={value || null} name={displayName || label} size="lg" ariaLabel={label} />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {value
            ? (isPreset ? AVATAR_OPTIONS.find((a) => a.url === value)?.label ?? '' : '🔗 URL personnalisée')
            : 'Aucun avatar sélectionné'}
        </span>
      </div>

      {/* Grid */}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-6 gap-2 sm:grid-cols-8"
      >
        {AVATAR_OPTIONS.map((av) => {
          const selected = value === av.url;
          return (
            <button
              key={av.url}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={av.label}
              title={av.label}
              onClick={() => { onChange(av.url); setShowCustom(false); }}
              className={[
                'rounded-xl border-2 p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                selected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={av.url}
                alt={av.label}
                width={48}
                height={48}
                className="h-10 w-10 rounded-lg"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* Toggle URL personnalisée */}
      <button
        type="button"
        onClick={() => { setShowCustom((v) => !v); }}
        className="self-start text-xs text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
      >
        {showCustom ? '▲ Masquer l\'URL personnalisée' : '▼ Utiliser une URL personnalisée'}
      </button>

      {showCustom && (
        <Input
          id="avatarUrl-custom"
          name="avatarUrl-custom"
          type="url"
          value={value}
          onChange={(e) => { onChange((e.target as HTMLInputElement).value); }}
          maxLength={2048}
          placeholder="https://…"
          aria-label="URL de l'avatar"
        />
      )}
    </div>
  );
}

function formString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function EditProfileForm({
  locale,
  initial,
  copy,
  redirectTo,
}: EditProfileFormProps): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, UpdateProfileFieldErrorCode>>>({});
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);

  const destination = redirectTo ?? `/${locale}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const input: UpdateProfileInput = {
      firstName: formString(fd, 'firstName'),
      lastName: formString(fd, 'lastName'),
      displayName: formString(fd, 'displayName'),
      currentGrade: formString(fd, 'currentGrade') as UpdateProfileInput['currentGrade'],
      preferredLocale: (formString(fd, 'preferredLocale') || 'FR') as 'FR' | 'EN',
      avatarUrl,
    };
    startTransition(async () => {
      const result = await updateProfile(input);
      if (result.ok) {
        setSuccess(true);
        // Courte pause pour que l'utilisateur voie le message de succès,
        // puis redirection vers la destination.
        setTimeout(() => { router.push(destination); }, 800);
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
              <option key={g.value || 'none'} value={g.value}>
                {g.label}
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

      {/* Avatar picker */}
      <FormField
        id="avatar"
        label={locale === 'fr' ? 'Avatar' : 'Avatar'}
        hint={locale === 'fr' ? "Choisis un avatar parmi la sélection ou entre une URL." : "Pick an avatar or enter a custom URL."}
        error={errors.avatarUrl ? copy.errors[errors.avatarUrl] : undefined}
      >
        <AvatarPicker
          value={avatarUrl}
          onChange={setAvatarUrl}
          displayName={initial.displayName || initial.firstName}
          label={locale === 'fr' ? 'Choisir un avatar' : 'Choose an avatar'}
        />
      </FormField>

      {/* Hidden input pour soumettre l'avatarUrl sélectionné */}
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" size="lg" isLoading={pending}>
          {pending ? copy.submitting : copy.submit}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => { router.push(`/${locale}/profil`); }}
        >
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}
