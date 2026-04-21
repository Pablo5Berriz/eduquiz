/**
 * Logo EduQuiz.
 *
 * SVG inline, sans dépendance, scalé par la prop `size`. Le dégradé de
 * la livery provisoire utilise la palette `brand` Tailwind (bleu
 * EduQuiz). Le composant accepte une `title` personnalisée pour que les
 * lecteurs d'écran annoncent le bon libellé (traduit côté appelant).
 */
import { cn } from '../utils/cn';

import type { JSX } from 'react';

export interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly withWordmark?: boolean;
  readonly title?: string;
  readonly className?: string;
}

const dimensions: Record<NonNullable<LogoProps['size']>, { mark: number; text: string }> = {
  sm: { mark: 20, text: 'text-base' },
  md: { mark: 28, text: 'text-lg' },
  lg: { mark: 36, text: 'text-2xl' },
};

export function Logo({
  size = 'md',
  withWordmark = true,
  title = 'EduQuiz',
  className,
}: LogoProps): JSX.Element {
  const dim = dimensions[size];

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-slate-900 dark:text-white', className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={dim.mark}
        height={dim.mark}
        viewBox="0 0 32 32"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="eduquiz-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#eduquiz-logo-gradient)" />
        <path
          d="M10 12.5h7M10 16h10M10 19.5h6"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="23" cy="22" r="2.5" fill="#ffffff" />
      </svg>
      {withWordmark ? (
        <span className={cn('font-bold tracking-tight', dim.text)}>EduQuiz</span>
      ) : null}
    </span>
  );
}
