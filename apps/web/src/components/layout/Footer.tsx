/**
 * Footer public d'EduQuiz.
 *
 * 4 colonnes (Produit / Ressources / Entreprise / Légal) + bandeau bas
 * avec copyright dynamique, mention "Conçu au Québec" et sélecteur de
 * langue dupliqué pour les utilisateurs qui n'ont pas vu celui du
 * header. Les liens pointent sur les pages vitrine de l'étape 1.2 ;
 * tant qu'elles ne sont pas implémentées, Next renverra une 404 propre.
 */
import { t, tf, type Locale, type Messages } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { LocaleSwitcher } from './LocaleSwitcher';

import type { JSX } from 'react';

export interface FooterProps {
  readonly locale: Locale;
  readonly messages: Messages;
}

interface FooterLink {
  readonly key: string;
  readonly href: (locale: Locale) => string;
}

interface FooterColumn {
  readonly titleKey: string;
  readonly links: readonly FooterLink[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    titleKey: 'footer.product',
    links: [
      { key: 'nav.features', href: (l) => `/${l}/fonctionnalites` },
      { key: 'nav.subjects', href: (l) => `/${l}/matieres` },
      { key: 'nav.pricing', href: (l) => `/${l}/tarifs` },
    ],
  },
  {
    titleKey: 'footer.resources',
    links: [
      { key: 'nav.testimonials', href: (l) => `/${l}/temoignages` },
      { key: 'nav.blog', href: (l) => `/${l}/blogue` },
      { key: 'nav.faq', href: (l) => `/${l}/faq` },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { key: 'nav.about', href: (l) => `/${l}/a-propos` },
      { key: 'nav.contact', href: (l) => `/${l}/contact` },
    ],
  },
  {
    titleKey: 'footer.legal',
    links: [
      { key: 'footer.privacy', href: (l) => `/${l}/confidentialite` },
      { key: 'footer.terms', href: (l) => `/${l}/conditions` },
      { key: 'footer.cookies', href: (l) => `/${l}/cookies` },
      { key: 'footer.accessibility', href: (l) => `/${l}/accessibilite` },
      { key: 'footer.loi25', href: (l) => `/${l}/loi-25` },
    ],
  },
];

export function Footer({ locale, messages }: FooterProps): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <Container width="xl" className="py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.titleKey} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t(messages, col.titleKey)}
              </h2>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href(locale)}
                      className="text-sm text-slate-700 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:text-brand-300"
                    >
                      {t(messages, link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p>{tf(messages, 'footer.rights', { year })}</p>
            <p>{t(messages, 'footer.madeIn')}</p>
          </div>
          <LocaleSwitcher currentLocale={locale} messages={messages} />
        </div>
      </Container>
    </footer>
  );
}
