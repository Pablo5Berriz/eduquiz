/**
 * Helper de fusion de classes Tailwind.
 *
 * Wrapper léger autour de `clsx` qui sert deux objectifs :
 *   1. Conditionner facilement les classes (`cn('base', isActive && 'active')`).
 *   2. Permettre aux composants `tailwind-variants` de combiner leurs
 *      tokens avec d'éventuelles overrides passées par l'appelant.
 *
 * Note : on ne ramène PAS `tailwind-merge` à ce stade pour rester léger.
 * Les conflits sont à éviter en discipline de design plutôt qu'en
 * post-traitement runtime.
 */
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
