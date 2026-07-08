import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { requireRoleOrRedirect } from '../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';
import { UserRole } from '@eduquiz/db';

import type { JSX, ReactNode } from 'react';

export default async function AdminLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireRoleOrRedirect(locale, UserRole.ADMIN, `/${locale}/admin`);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      {/* Admin topbar */}
      <header className="border-b border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
        <Container width="lg" className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}`}
              className="text-sm font-bold tracking-tight text-slate-900 hover:text-brand-700 dark:text-slate-100"
            >
              EduQuiz
            </Link>
            <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-800 dark:text-amber-200">
              Admin
            </span>
            <nav className="flex items-center gap-3" aria-label="Navigation admin">
              <Link
                href={`/${locale}/admin`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Vue d&apos;ensemble
              </Link>
              <Link
                href={`/${locale}/admin/cours`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Cours
              </Link>
            </nav>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
        </Container>
      </header>

      <main className="flex-1 py-8">
        <Container width="lg">{children}</Container>
      </main>
    </div>
  );
}
