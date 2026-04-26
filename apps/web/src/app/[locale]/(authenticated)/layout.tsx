import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { UserMenu } from '../../../components/auth/UserMenu';
import { requireAuthenticated } from '../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { JSX, ReactNode } from 'react';

/**
 * Layout commun aux routes authentifiées (route group `(authenticated)`).
 *
 * Garantit que `requireAuthenticated()` est appelé en amont — si la
 * session manque, redirige vers `/connexion?next=...`. Le middleware
 * Edge bloquerait déjà l'accès, mais cette double garde sécurise les
 * cas où le middleware serait modifié sans toucher au layout.
 *
 * Rend un header simple (logo + UserMenu) en réutilisant les helpers
 * i18n. La vitrine publique a son propre `Header` plus complet ; ici
 * on garde une présentation minimale pour rester focalisé sur les
 * actions de compte.
 */

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  const user = await requireAuthenticated(locale, '/');

  // Nom affichable : prend `name` (porté par session.user) ou tombe
  // sur l'email avant @. `requireAuthenticated` a déjà vérifié que le
  // compte est actif.
  const displayName = user.name && user.name.length > 0 ? user.name : user.email.split('@')[0]!;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Container width="lg" className="flex items-center justify-between gap-4 py-3">
          <Link
            href={`/${locale}`}
            className="text-base font-bold tracking-tight text-slate-900 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-100"
          >
            EduQuiz
          </Link>
          <UserMenu
            locale={locale}
            displayName={displayName}
            avatarUrl={user.image}
            copy={{
              open: t(messages, 'account.userMenu.open'),
              profile: t(messages, 'account.userMenu.profile'),
              settings: t(messages, 'account.userMenu.settings'),
              signOut: t(messages, 'account.userMenu.signOut'),
            }}
          />
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
