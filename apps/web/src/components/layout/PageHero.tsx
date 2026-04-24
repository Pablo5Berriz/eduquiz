/**
 * En-tête de page vitrine (kicker + titre + sous-titre) partagé entre
 * les pages secondaires (Fonctionnalités, Matières, Tarifs, etc.).
 *
 * Rend un `<section>` avec un `<h1>` unique pour la page (le layout
 * `[locale]/layout.tsx` ne porte pas de `<h1>`). Le dégradé discret en
 * arrière-plan crée une transition visuelle avec le header tout en
 * restant sobre.
 *
 * Server component : aucune dépendance navigateur.
 */
import { Container, cn } from '@eduquiz/ui';

import type { JSX, ReactNode } from 'react';

export interface PageHeroProps {
  readonly kicker?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function PageHero({
  kicker,
  title,
  subtitle,
  actions,
  className,
}: PageHeroProps): JSX.Element {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white dark:border-slate-800 dark:from-brand-950/30 dark:via-slate-950 dark:to-slate-950',
        className,
      )}
    >
      <Container width="lg" className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          {kicker !== undefined && kicker !== null && kicker !== '' ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
              {kicker}
            </p>
          ) : null}

          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>

          {subtitle !== undefined && subtitle !== null && subtitle !== '' ? (
            <p className="text-balance text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              {subtitle}
            </p>
          ) : null}

          {actions !== undefined && actions !== null ? (
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">{actions}</div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
