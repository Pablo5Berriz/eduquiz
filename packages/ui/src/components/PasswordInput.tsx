/**
 * Champ mot de passe avec bouton « œil » pour afficher/masquer la
 * saisie. Composant client (utilise `useState`).
 *
 * Accessibilité :
 *   - `aria-label` du bouton bascule entre « Afficher » et « Masquer »
 *   - le bouton est `type="button"` pour ne pas submit le form
 *   - le focus reste sur le bouton après bascule (pas de glissement
 *     de focus surprise)
 */
'use client';

import { forwardRef, useState } from 'react';

import { cn } from '../utils/cn';

import { Input, type InputProps } from './Input';

import type { JSX } from 'react';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Texte du bouton « afficher » pour les lecteurs d'écran. */
  readonly showLabel?: string;
  /** Texte du bouton « masquer » pour les lecteurs d'écran. */
  readonly hideLabel?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      showLabel = 'Afficher le mot de passe',
      hideLabel = 'Masquer le mot de passe',
      className,
      ...rest
    },
    ref,
  ): JSX.Element {
    const [visible, setVisible] = useState(false);
    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          className="pr-12"
          {...rest}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
          }}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span aria-hidden="true">{visible ? '🙈' : '👁'}</span>
        </button>
      </div>
    );
  },
);
