'use client';

/**
 * Sidebar de navigation des paramètres — Client Component.
 *
 * Utilise `usePathname()` pour détecter la section active de manière
 * fiable, sans dépendre des headers HTTP. Icônes SVG inline (pas de
 * lib externe). Section "Suppression" colorée en rouge.
 */

import { cn } from '@eduquiz/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { JSX } from 'react';

// ── Icônes SVG inline ────────────────────────────────────────────────────────

function IconUser(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
  );
}

function IconBell(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6Zm0 14.25a2 2 0 0 1-1.98-1.75h3.96A2 2 0 0 1 10 16.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconGlobe(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-1.503.204A6.502 6.502 0 0 1 10 16.5a6.5 6.5 0 0 1-6.496-6.273L6.5 12.228l1.323-3.969 3.58 1.207-.672 2.017H12.5l1.354-4.062 2.016 1.008.628 3.774ZM10 3.5a6.502 6.502 0 0 0-6.498 6.241L5.5 7.757l2.25.75L9.066 5.5h1.442l.893 1.34 1.607-.804L14 3.874A6.498 6.498 0 0 0 10 3.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconSun(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06L5.404 4.343a.75.75 0 1 0-1.06 1.06l1.06 1.061Z" />
    </svg>
  );
}

function IconEye(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconDevices(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 1 1.1 1.677A.75.75 0 0 1 13 17.5H7a.75.75 0 0 1-.75-.75.75.75 0 0 1 0-.008 3.5 3.5 0 0 1 1.097-1.742H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconDatabase(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
    </svg>
  );
}

function IconTrash(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SettingsSidebarItem {
  readonly key: string;
  readonly href: string;
  readonly label: string;
  readonly icon: JSX.Element;
  readonly tone?: 'default' | 'danger';
}

export interface SettingsSidebarClientProps {
  readonly items: readonly SettingsSidebarItem[];
  readonly className?: string;
}

// ── Composant ────────────────────────────────────────────────────────────────

export function SettingsSidebarClient({
  items,
  className,
}: SettingsSidebarClientProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation des paramètres" className={cn('flex flex-col gap-0.5', className)}>
      {items.map((item) => {
        const active = pathname.includes(item.href.replace(/^\/[a-z]{2}/, ''));
        const danger = item.tone === 'danger';
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              active &&
                !danger &&
                'bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200',
              !active &&
                !danger &&
                'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              danger &&
                active &&
                'bg-danger-50 text-danger-700 dark:bg-danger-950/40 dark:text-danger-300',
              danger &&
                !active &&
                'text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-950/30 dark:hover:text-danger-300',
            )}
          >
            <span
              className={cn(
                active && !danger && 'text-brand-600 dark:text-brand-400',
                !active &&
                  !danger &&
                  'text-slate-400 group-hover:text-slate-600 dark:text-slate-500',
                danger && 'text-danger-500 dark:text-danger-400',
              )}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Factory d'items avec icônes ────────────────────────────────────────────────

export function makeSettingsItems(locale: string): SettingsSidebarItem[] {
  const isFr = locale === 'fr';
  return [
    {
      key: 'account',
      href: `/${locale}/parametres/compte`,
      icon: <IconUser />,
      label: isFr ? 'Compte' : 'Account',
    },
    {
      key: 'notifications',
      href: `/${locale}/parametres/notifications`,
      icon: <IconBell />,
      label: isFr ? 'Notifications' : 'Notifications',
    },
    {
      key: 'language',
      href: `/${locale}/parametres/langue`,
      icon: <IconGlobe />,
      label: isFr ? 'Langue' : 'Language',
    },
    {
      key: 'theme',
      href: `/${locale}/parametres/theme`,
      icon: <IconSun />,
      label: isFr ? 'Apparence' : 'Appearance',
    },
    {
      key: 'accessibility',
      href: `/${locale}/parametres/accessibilite`,
      icon: <IconEye />,
      label: isFr ? 'Accessibilité' : 'Accessibility',
    },
    {
      key: 'sessions',
      href: `/${locale}/parametres/sessions`,
      icon: <IconDevices />,
      label: isFr ? 'Sessions' : 'Sessions',
    },
    {
      key: 'data',
      href: `/${locale}/parametres/donnees`,
      icon: <IconDatabase />,
      label: isFr ? 'Mes données' : 'My data',
    },
    {
      key: 'deletion',
      href: `/${locale}/parametres/suppression`,
      icon: <IconTrash />,
      label: isFr ? 'Supprimer mon compte' : 'Delete account',
      tone: 'danger',
    },
  ];
}
