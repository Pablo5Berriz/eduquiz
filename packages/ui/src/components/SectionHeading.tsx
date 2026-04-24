/**
 * En-tête de section standardisé (kicker + titre + description).
 *
 * Pose une hiérarchie visuelle cohérente sur toute la vitrine :
 *   - kicker : petite étiquette `<p>` en capitales, couleur marque,
 *     utile pour annoncer la rubrique (« Fonctionnalités », « Tarifs »…).
 *   - title : `<h2>` par défaut (configurable via `as`) pour ne pas
 *     casser l'arbre d'accessibilité quand la section vit dans un
 *     layout qui porte déjà le `<h1>` de page.
 *   - description : paragraphe optionnel, texte atténué.
 *
 * Le composant ne définit pas de marges externes : c'est au consommateur
 * de positionner la section dans la grille (évite les effets de bord).
 */
import { cn } from '../utils/cn';

import type { ElementType, JSX, ReactNode } from 'react';

export interface SectionHeadingProps {
  readonly kicker?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly as?: ElementType;
  readonly align?: 'left' | 'center';
  readonly className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  as,
  align = 'left',
  className,
}: SectionHeadingProps): JSX.Element {
  const TitleTag: ElementType = as ?? 'h2';
  return (
    <header
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {kicker !== undefined && kicker !== null && kicker !== '' ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {kicker}
        </p>
      ) : null}

      <TitleTag className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </TitleTag>

      {description !== undefined && description !== null && description !== '' ? (
        <p
          className={cn(
            'text-balance text-base text-slate-600 dark:text-slate-300 sm:text-lg',
            align === 'center' ? 'max-w-2xl' : 'max-w-3xl',
          )}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
