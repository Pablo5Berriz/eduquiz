/**
 * Wrapper de champ de formulaire.
 *
 * Orchestre :
 *   - le label associé via `htmlFor` (utiliser le même `id` sur l'input)
 *   - le texte d'aide (`hint`) lié via `aria-describedby`
 *   - le message d'erreur (`error`) lié via `aria-describedby` ET
 *     `aria-invalid` sur l'input
 *
 * Usage :
 * ```tsx
 * <FormField id="email" label="Courriel" hint="Personnel ou pro" error={errors.email}>
 *   <Input id="email" name="email" type="email" invalid={!!errors.email} />
 * </FormField>
 * ```
 *
 * Le composant ne touche pas aux enfants : c'est à l'appelant de poser
 * `id`, `aria-describedby={[`${id}-hint`, `${id}-error`].filter(...)}`,
 * `invalid` sur l'input. C'est un peu plus verbeux qu'un `cloneElement`
 * mais ça reste explicite et trivial à inspecter.
 */

import { cn } from '../utils/cn';

import type { JSX, ReactNode } from 'react';

export interface FormFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  /** Texte d'aide affiché sous le label (avant l'input). */
  readonly hint?: ReactNode;
  /** Message d'erreur. Si présent, l'input doit recevoir `invalid`. */
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  // Note : c'est à l'appelant de répercuter `aria-describedby` sur
  // l'input. On expose l'id ici via un petit data-attribute pour faire
  // la passerelle dans les outils de dev sans imposer de cloneElement.
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger-500">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-danger-700 dark:text-danger-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
