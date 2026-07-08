/**
 * Header universel d'EduQuiz.
 *
 * Server component. Reçoit un `user` optionnel passé par le layout locale.
 * - Sans user  → nav publique (liens marketing + Se connecter / S'inscrire).
 * - Avec user  → nav apprenant (Apprendre + UserMenu).
 *
 * Le LocaleSwitcher reste visible dans les deux états.
 */
import { t, type Locale, type Messages } from '@eduquiz/i18n';
import { Button, Container, Logo } from '@eduquiz/ui';
import Link from 'next/link';

import { UserMenu } from '../auth/UserMenu';
import { LocaleSwitcher } from './LocaleSwitcher';

import type { JSX } from 'react';

export interface HeaderUser {
  readonly displayName: string;
  readonly avatarUrl: string | null;
}

export interface HeaderProps {
  readonly locale: Locale;
  readonly messages: Messages;
  readonly user?: HeaderUser | null;
}

interface NavLinkSpec {
  readonly key: string;
  readonly href: (locale: Locale) => string;
}

const NAV_LINKS: readonly NavLinkSpec[] = [
  { key: 'nav.features', href: (l) => `/${l}/fonctionnalites` },
  { key: 'nav.subjects', href: (l) => `/${l}/matieres` },
  { key: 'nav.pricing', href: (l) => `/${l}/tarifs` },
  { key: 'nav.about', href: (l) => `/${l}/a-propos` },
  { key: 'nav.contact', href: (l) => `/${l}/contact` },
];

export function Header({ locale, messages, user }: HeaderProps): JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-slate-800 dark:bg-slate-950/90 dark:supports-[backdrop-filter]:bg-slate-950/75">
      <Container width="xl" className="flex h-16 items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-8">
          <Link
            href={`/${locale}`}
            aria-label={t(messages, 'common.appName')}
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500"
          >
            <Logo size="md" />
          </Link>

          {user ? (
            <nav
              aria-label={locale === 'fr' ? 'Navigation apprenant' : 'Learner navigation'}
              className="hidden gap-6 md:flex"
            >
              <Link
                href={`/${locale}/apprendre`}
                className="text-sm font-semibold text-slate-700 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:text-brand-300"
              >
                {locale === 'fr' ? 'Apprendre' : 'Learn'}
              </Link>
            </nav>
          ) : (
            <nav aria-label={t(messages, 'nav.home')} className="hidden gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href(locale)}
                  className="text-sm font-medium text-slate-700 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:text-brand-300"
                >
                  {t(messages, link.key)}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher currentLocale={locale} messages={messages} />

          {user ? (
            <UserMenu
              locale={locale}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              copy={{
                open: t(messages, 'account.userMenu.open'),
                profile: t(messages, 'account.userMenu.profile'),
                settings: t(messages, 'account.userMenu.settings'),
                signOut: t(messages, 'account.userMenu.signOut'),
              }}
            />
          ) : (
            <>
              <Link
                href={`/${locale}/connexion`}
                className="hidden text-sm font-semibold text-slate-700 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:text-brand-300 sm:inline"
              >
                {t(messages, 'nav.signIn')}
              </Link>
              <Link href={`/${locale}/inscription`} className="inline-flex">
                <Button variant="primary" size="sm">
                  {t(messages, 'nav.signUp')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
