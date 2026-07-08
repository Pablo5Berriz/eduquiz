/**
 * Avatar circulaire avec fallback initiales.
 *
 * Si `src` est fourni et chargé, rend une image. Sinon (ou si `src`
 * vide/null), rend un cercle coloré avec les initiales calculées
 * depuis `name`. La couleur de fond est dérivée de manière déterministe
 * du nom (palette de 6 teintes) — même utilisateur = même couleur,
 * sans aller chercher en DB.
 *
 * Tailles disponibles via `size` (`sm` 32px / `md` 40px / `lg` 64px /
 * `xl` 96px).
 *
 * Accessibilité :
 *   - `<img>` reçoit l'`alt` (passer le nom complet)
 *   - le fallback initiales est `aria-hidden` (le nom est déjà porté
 *     par le contexte parent, sinon passer `aria-label`)
 */

import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { JSX } from 'react';

const avatar = tv({
  base: 'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-16 w-16 text-lg',
      xl: 'h-24 w-24 text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type AvatarVariants = VariantProps<typeof avatar>;

export interface AvatarProps extends AvatarVariants {
  readonly src?: string | null;
  readonly name: string;
  readonly className?: string;
  /** Si fourni, override le fallback ARIA (pour les contextes décoratifs). */
  readonly ariaLabel?: string;
}

const PALETTE = [
  'bg-brand-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-sky-600',
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? 'bg-brand-600';
}

function computeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0];
  if (!first) return '?';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts.at(-1) ?? first;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export function Avatar({ src, name, size, className, ariaLabel }: AvatarProps): JSX.Element {
  const styles = avatar({ size });
  const initials = computeInitials(name);
  const color = pickColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={ariaLabel ?? name}
        className={cn(styles, 'object-cover', className)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      className={cn(styles, color, className)}
      aria-label={ariaLabel ?? name}
      role="img"
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
