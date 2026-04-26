import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import { headers } from 'next/headers';

import { SettingsSidebar } from '../../../../components/auth/SettingsSidebar';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { JSX, ReactNode } from 'react';

/**
 * Layout commun aux pages de paramètres.
 *
 * Rend une sidebar gauche (desktop) ou une nav verticale empilée
 * (mobile) avec les 4 sections : Compte, Langue, Données, Suppression.
 *
 * L'état actif est calculé depuis l'en-tête `x-pathname` posé par notre
 * middleware Next.js (à défaut, on lit `next-url` ou `referer`). En V1
 * on accepte que le surlignage actif soit absent si la requête n'a pas
 * cet en-tête — le contenu reste lisible.
 */

export default function SettingsLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  // Next 14 ne fournit pas `pathname` côté layout. On lit l'URL depuis
  // les headers en best-effort. Sans ça, `activeKey = null` et tous
  // les liens sont rendus sans état actif (acceptable, juste moins
  // confortable).
  const h = headers();
  const referer = h.get('referer') ?? '';
  const nextUrl = h.get('x-invoke-path') ?? h.get('next-url') ?? '';
  const path = nextUrl || referer;
  let activeKey: string | null = null;
  if (path.includes('/parametres/compte')) activeKey = 'account';
  else if (path.includes('/parametres/langue')) activeKey = 'language';
  else if (path.includes('/parametres/donnees')) activeKey = 'data';
  else if (path.includes('/parametres/suppression')) activeKey = 'deletion';

  const items = [
    { key: 'account', href: `/${locale}/parametres/compte`, label: t(messages, 'account.settings.navigation.account') },
    { key: 'language', href: `/${locale}/parametres/langue`, label: t(messages, 'account.settings.navigation.language') },
    { key: 'data', href: `/${locale}/parametres/donnees`, label: t(messages, 'account.settings.navigation.data') },
    {
      key: 'deletion',
      href: `/${locale}/parametres/suppression`,
      label: t(messages, 'account.settings.navigation.deletion'),
      tone: 'danger' as const,
    },
  ];

  return (
    <Container width="lg" className="py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <SettingsSidebar items={items} activeKey={activeKey} />
        <div>{children}</div>
      </div>
    </Container>
  );
}
