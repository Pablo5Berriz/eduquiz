import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';
import { guardMinorParentLink, requireAuthenticated } from '../../../lib/auth/server';

import type { JSX, ReactNode } from 'react';

/**
 * Layout commun aux routes authentifiées (route group `(authenticated)`).
 *
 * Garantit que `requireAuthenticated()` est appelé en amont — si la
 * session manque, redirige vers `/connexion?next=...`.
 *
 * Le header est rendu par le layout parent `[locale]/layout.tsx` qui est
 * auth-aware (passe `user` au Header universel). Ce layout se contente
 * d'appliquer le fond et de garder la garde d'accès.
 */
export default async function AuthenticatedLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireAuthenticated(locale, '/');
  await guardMinorParentLink(user, locale);

  return <div className="flex-1 bg-slate-50 dark:bg-slate-950">{children}</div>;
}
