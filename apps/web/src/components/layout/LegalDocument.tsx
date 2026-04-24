import { t, tList, type Messages } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import Link from 'next/link';

import { PageHero } from './PageHero';

import type { JSX } from 'react';

/**
 * Composant partagé pour les pages « Mentions légales ».
 *
 * Factorise la structure commune (hero + liste de paragraphes + date de
 * mise à jour + liens de navigation vers les autres pages légales). Le
 * contenu est entièrement piloté par le dictionnaire i18n.
 */

interface LegalLink {
  readonly href: string;
  readonly labelKey: string;
}

export interface LegalDocumentProps {
  readonly locale: string;
  readonly messages: Messages;
  /** Racine du namespace i18n pour cette page (ex: `legal.privacy`). */
  readonly namespace: string;
  /** Liens vers les autres pages légales (tous sauf la courante). */
  readonly relatedLinks: readonly LegalLink[];
}

export function LegalDocument({
  locale,
  messages,
  namespace,
  relatedLinks,
}: LegalDocumentProps): JSX.Element {
  const paragraphs = tList(messages, `${namespace}.paragraphs`);

  return (
    <>
      <PageHero
        kicker={t(messages, `${namespace}.heroKicker`)}
        title={t(messages, `${namespace}.heroTitle`)}
        subtitle={t(messages, `${namespace}.heroSubtitle`)}
      />

      <Container width="md" className="py-16">
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t(messages, 'legal.common.lastUpdatedLabel')} ·{' '}
          <time>{t(messages, 'legal.common.lastUpdatedValue')}</time>
        </p>

        <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
          {paragraphs.map((paragraph, index) => (
            <p key={`${namespace}-p-${String(index)}`}>{paragraph}</p>
          ))}
        </div>

        <nav
          aria-label={t(messages, 'footer.legal')}
          className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t(messages, 'legal.common.backToLegal')}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={`/${locale}${link.href}`}
                  className="text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {t(messages, link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </>
  );
}

/**
 * Définition centralisée des 5 pages légales. Utilisée par chaque route
 * pour générer à la fois le metadata et la liste de liens des autres
 * documents.
 */
export const LEGAL_PAGES = [
  {
    slug: '/confidentialite',
    namespace: 'legal.privacy',
    labelKey: 'footer.privacy',
    navKey: 'nav.about',
  },
  {
    slug: '/conditions',
    namespace: 'legal.terms',
    labelKey: 'footer.terms',
    navKey: 'nav.about',
  },
  {
    slug: '/cookies',
    namespace: 'legal.cookies',
    labelKey: 'footer.cookies',
    navKey: 'nav.about',
  },
  {
    slug: '/accessibilite',
    namespace: 'legal.accessibility',
    labelKey: 'footer.accessibility',
    navKey: 'nav.about',
  },
  {
    slug: '/loi-25',
    namespace: 'legal.loi25',
    labelKey: 'footer.loi25',
    navKey: 'nav.about',
  },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]['slug'];

export function getRelatedLegalLinks(currentSlug: LegalSlug): readonly LegalLink[] {
  return LEGAL_PAGES.filter((page) => page.slug !== currentSlug).map((page) => ({
    href: page.slug,
    labelKey: page.labelKey,
  }));
}
