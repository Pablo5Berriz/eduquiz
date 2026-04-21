/**
 * Bouton EduQuiz.
 *
 * Implémenté avec `tailwind-variants` pour :
 *   - typer fortement les variants (variant + size + tone) ;
 *   - exposer une API uniforme web/mobile (les versions RN seront
 *     introduites quand on ajoutera NativeWind, en réutilisant les mêmes
 *     tokens) ;
 *   - garantir des cibles tactiles >= 44px (WCAG 2.5.5) via `min-h-touch-min`.
 *
 * Accessibilité :
 *   - focus visible universel (style `focus-visible:` géré par Tailwind) ;
 *   - `aria-busy` exposé quand `isLoading` est true ;
 *   - texte des spinners porté par les enfants pour rester traduisible.
 */
import { forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

const button = tv({
  base: [
    'inline-flex items-center justify-center gap-2',
    'min-h-touch-min rounded-lg font-semibold',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ],
  variants: {
    variant: {
      primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
      secondary:
        'border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
      danger: 'bg-danger-500 text-white shadow-sm hover:bg-danger-700',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
  },
});

export type ButtonVariants = VariantProps<typeof button>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  readonly isLoading?: boolean;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    fullWidth,
    className,
    children,
    isLoading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
): JSX.Element {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={isLoading || undefined}
      disabled={disabled === true || isLoading}
      className={cn(button({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
    </button>
  );
});
