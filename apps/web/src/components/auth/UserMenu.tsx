'use client';

/**
 * Dropdown utilisateur du header app.
 *
 * Comporte :
 *   - bouton avec avatar + nom (cliquable pour ouvrir/fermer)
 *   - menu (Mon profil, Paramètres, Me déconnecter)
 *   - fermeture sur clic en dehors et sur Escape
 *   - ARIA : `aria-haspopup`, `aria-expanded`, `role="menu"`, etc.
 *   - le bouton « Me déconnecter » est un `<form>` qui appelle la
 *     Server Action `signOutUser` — pas de fetch JS custom
 *
 * Tout reste léger : pas de Radix/Headless en V1, on gère deux états
 * et trois écouteurs.
 */

import { Avatar } from '@eduquiz/ui';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { signOutUser } from '../../lib/auth/actions/account';

import type { JSX } from 'react';

export interface UserMenuCopy {
  readonly open: string;
  readonly profile: string;
  readonly settings: string;
  readonly signOut: string;
}

export interface UserMenuProps {
  readonly locale: 'fr' | 'en';
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly copy: UserMenuCopy;
}

export function UserMenu({ locale, displayName, avatarUrl, copy }: UserMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent): void {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={copy.open}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-transparent p-1 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:hover:border-slate-700"
      >
        <Avatar src={avatarUrl} name={displayName} size="md" ariaLabel={displayName} />
        <span aria-hidden="true" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
          </div>
          <ul className="flex flex-col py-1">
            <li role="none">
              <Link
                role="menuitem"
                href={`/${locale}/profil`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
              >
                <span aria-hidden="true">👤</span>
                {copy.profile}
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                href={`/${locale}/parametres`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
              >
                <span aria-hidden="true">⚙</span>
                {copy.settings}
              </Link>
            </li>
            <li role="none" className="border-t border-slate-200 dark:border-slate-800">
              <form action={signOutUser.bind(null, locale)}>
                <button
                  role="menuitem"
                  type="submit"
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
                >
                  <span aria-hidden="true">🚪</span>
                  {copy.signOut}
                </button>
              </form>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
