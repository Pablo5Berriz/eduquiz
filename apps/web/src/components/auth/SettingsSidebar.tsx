/**
 * Sidebar de navigation des paramètres (Server Component).
 *
 * Rend une liste verticale d'entrées avec un état actif basé sur
 * l'URL courante (`pathname`). Comme on est server-side, on calcule
 * l'état actif à partir d'une prop `pathname` passée par le caller.
 * Sur mobile, la sidebar devient une simple liste empilée verticalement
 * avant le contenu.
 */

import { cn } from '@eduquiz/ui';
import Link from 'next/link';

import type { JSX } from 'react';

export interface SettingsSidebarItem {
  readonly key: string;
  readonly href: string;
  readonly label: string;
  readonly tone?: 'default' | 'danger';
}

export interface SettingsSidebarProps {
  readonly items: readonly SettingsSidebarItem[];
  readonly activeKey: string | null;
  readonly className?: string;
}

export function SettingsSidebar({
  items,
  activeKey,
  className,
}: SettingsSidebarProps): JSX.Element {
  return (
    <nav aria-label="Settings navigation" className={cn('flex flex-col gap-1', className)}>
      {items.map((item) => {
        const active = item.key === activeKey;
        const danger = item.tone === 'danger';
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500',
              active &&
                !danger &&
                'bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200',
              !active &&
                !danger &&
                'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
              danger &&
                active &&
                'bg-danger-50 text-danger-800 dark:bg-danger-950/40 dark:text-danger-200',
              danger &&
                !active &&
                'text-danger-700 hover:bg-danger-50 dark:text-danger-300 dark:hover:bg-danger-950/30',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
