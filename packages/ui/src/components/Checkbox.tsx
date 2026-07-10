/**
 * Case à cocher EduQuiz.
 *
 * Composant non contrôlé par défaut — passer `checked`/`onChange` pour
 * le contrôler. Le label est rendu à droite via `children` (pratique
 * pour insérer des liens vers CGU/Politique).
 *
 * Accessibilité :
 *   - cible cliquable étendue au label entier (`<label>` englobant)
 *   - état d'erreur `invalid` rendu visuellement et par `aria-invalid`
 *   - cible tactile ≥ 24px sur la case + 24px de padding latéral via le
 *     label cliquable, soit ≥ 44px utilisables (WCAG 2.5.5)
 */

import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { InputHTMLAttributes, JSX, ReactNode } from 'react';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  readonly invalid?: boolean;
  /** Label affiché à droite de la case. */
  readonly children: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, children, invalid = false, ...rest },
  ref,
): JSX.Element {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 py-1 text-sm text-slate-700 dark:text-slate-200',
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        aria-invalid={invalid || undefined}
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 shadow-sm',
          'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500',
          'dark:border-slate-700 dark:bg-slate-900',
          invalid && 'border-danger-500 focus-visible:ring-danger-500',
        )}
        {...rest}
      />
      <span className="flex-1">{children}</span>
    </label>
  );
});
