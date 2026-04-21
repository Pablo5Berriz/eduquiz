/**
 * Header public d'EduQuiz.
 *
 * Server component : on ne dépend pas de state navigateur. La bascule
 * de langue est un sous-composant client (LocaleSwitcher). Le menu
 * mobile sera introduit avec les écrans de l'étape 1.2 — pour l'instant
 * la nav principale est cachée en < md et seule la CTA d'inscription
 * reste visible.
 *
 * Choix d'accessibilité :
 *   - landmark `<header>` + `<nav aria-label="…">` ;
 *   - lien "skip to content" pour la navigation clavier ;
 *   - logo porteur d'un `aria-label` EduQuiz.
 */
import { t, type Locale, type Messages } from '@eduquiz/i18n';
import { Button, Container, Logo } from '@eduquiz/ui';
import Link from 'next/link';

import { LocaleSwitcher } from './LocaleSwitcher';

import type { JSX } from 'react';

export interface HeaderProps {
  readonly locale: Locale;
  readonly messages: Messages;
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

export function Header({ locale, messages }: HeaderProps): JSX.Element {
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
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher currentLocale={locale} messages={messages} />

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
        </div>
      </Container>
    </header>
  );
}
