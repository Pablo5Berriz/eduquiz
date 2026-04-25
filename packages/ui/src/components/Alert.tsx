/**
 * Bannière d'alerte EduQuiz.
 *
 * Variants `tone` : `info` / `success` / `warning` / `danger`. Chaque
 * variant a sa palette claire/sombre cohérente avec les tokens du
 * design system. Une icône Unicode minimaliste est rendue à gauche
 * (`aria-hidden`) — elle est purement décorative ; le sens est porté
 * par le texte.
 *
 * Accessibilité :
 *   - `role="status"` pour info/success (live region polie)
 *   - `role="alert"` pour warning/danger (live region assertive)
 *   - le titre est encapsulé dans `<strong>` plutôt qu'un heading pour
 *     ne pas casser la hiérarchie (les bannières sont contextuelles,
 *     pas structurelles)
 */

import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '../utils/cn';

import type { JSX, ReactNode } from 'react';

const alert = tv({
  slots: {
    root: 'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
    icon: 'shrink-0 text-base leading-6',
    body: 'flex-1',
    title: 'block font-semibold',
    description: 'mt-0.5 block',
  },
  variants: {
    tone: {
      info: {
        root: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100',
        icon: 'text-brand-600 dark:text-brand-300',
      },
      success: {
        root: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
        icon: 'text-emerald-600 dark:text-emerald-300',
      },
      warning: {
        root: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
        icon: 'text-amber-600 dark:text-amber-300',
      },
      danger: {
        root: 'border-danger-200 bg-danger-50 text-danger-900 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-100',
        icon: 'text-danger-600 dark:text-danger-300',
      },
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

const ICONS: Record<NonNullable<AlertVariants['tone']>, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
};

export type AlertVariants = VariantProps<typeof alert>;

export interface AlertProps extends AlertVariants {
  readonly title?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps): JSX.Element {
  const styles = alert({ tone });
  const role = tone === 'warning' || tone === 'danger' ? 'alert' : 'status';
  return (
    <div role={role} className={cn(styles.root(), className)}>
      <span aria-hidden="true" className={styles.icon()}>
        {ICONS[tone]}
      </span>
      <div className={styles.body()}>
        {title ? <strong className={styles.title()}>{title}</strong> : null}
        <span className={styles.description()}>{children}</span>
      </div>
    </div>
  );
}
