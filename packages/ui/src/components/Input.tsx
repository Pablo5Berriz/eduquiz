/**
 * Champ de saisie texte EduQuiz.
 *
 * Variants `tailwind-variants` alignés sur le design system :
 *   - état par défaut, focus visible, état d'erreur (`invalid`),
 *     `disabled`, taille `sm`/`md`/`lg`.
 *   - cible tactile ≥ 44px via `min-h-touch-min` sur les tailles md/lg.
 *
 * Pour brancher un label + texte d'aide + erreur, préférer `FormField`
 * qui orchestre `htmlFor` / `aria-describedby` / `aria-invalid` autour
 * de cet `Input`.
 */

import { forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { InputHTMLAttributes, JSX } from 'react';

const input = tv({
  base: [
    'block w-full rounded-lg border bg-white text-slate-900 shadow-sm',
    'placeholder:text-slate-400',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-950',
  ],
  variants: {
    size: {
      sm: 'min-h-9 px-3 py-1.5 text-sm',
      md: 'min-h-touch-min px-3 py-2 text-sm',
      lg: 'min-h-touch-min px-4 py-3 text-base',
    },
    invalid: {
      true: 'border-danger-500 focus-visible:ring-danger-500 dark:border-danger-500',
      false: 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600',
    },
  },
  defaultVariants: {
    size: 'md',
    invalid: false,
  },
});

export type InputVariants = VariantProps<typeof input>;

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputVariants {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, invalid, className, type = 'text', ...rest },
  ref,
): JSX.Element {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid ?? undefined}
      className={cn(input({ size, invalid }), className)}
      {...rest}
    />
  );
});
