/**
 * Conteneur responsive principal.
 *
 * Centre le contenu avec une largeur max accessible (~ 80ch en lecture
 * confortable) et applique les paddings horizontaux par breakpoint. Les
 * pages métier composent ce conteneur sans réimplémenter ces tokens.
 */
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { HTMLAttributes, JSX } from 'react';

const container = tv({
  base: 'mx-auto w-full px-4 sm:px-6 lg:px-8',
  variants: {
    width: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      prose: 'max-w-prose',
    },
  },
  defaultVariants: {
    width: 'lg',
  },
});

export type ContainerVariants = VariantProps<typeof container>;

export interface ContainerProps extends HTMLAttributes<HTMLDivElement>, ContainerVariants {}

export function Container({ width, className, children, ...rest }: ContainerProps): JSX.Element {
  return (
    <div className={cn(container({ width }), className)} {...rest}>
      {children}
    </div>
  );
}
