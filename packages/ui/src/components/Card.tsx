/**
 * Carte de contenu partagée.
 *
 * Utilisée partout sur la vitrine (fonctionnalités, matières, témoignages,
 * plans tarifaires…). Les variantes gèrent :
 *   - `variant` : style visuel (surface neutre, surface surlignée, bordure
 *     accentuée pour le plan mis en avant).
 *   - `padding` : densité interne (standard ou resserrée pour les listes).
 *
 * Par défaut la carte est rendue en `<article>` afin d'en faire un
 * landmark sémantique ; les consommateurs peuvent forcer une autre
 * balise via `as` (ex. `<li>` dans une liste).
 */
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { ElementType, HTMLAttributes, JSX } from 'react';

const card = tv({
  base: 'rounded-2xl border text-left transition-colors',
  variants: {
    variant: {
      surface:
        'border-slate-200 bg-white shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
      muted:
        'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60',
      accent:
        'border-brand-200 bg-brand-50 ring-1 ring-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:ring-brand-900',
    },
    padding: {
      md: 'p-6',
      lg: 'p-8',
      sm: 'p-4',
    },
  },
  defaultVariants: {
    variant: 'surface',
    padding: 'md',
  },
});

export type CardVariants = VariantProps<typeof card>;

export interface CardProps extends HTMLAttributes<HTMLElement>, CardVariants {
  readonly as?: ElementType;
}

export function Card({
  as,
  variant,
  padding,
  className,
  children,
  ...rest
}: CardProps): JSX.Element {
  const Component: ElementType = as ?? 'article';
  return (
    <Component className={cn(card({ variant, padding }), className)} {...rest}>
      {children}
    </Component>
  );
}
