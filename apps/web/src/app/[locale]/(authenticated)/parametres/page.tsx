import { getMessages, t } from '@eduquiz/i18n';
import { Card } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 31 — Index des paramètres.
 *
 * Liste les 4 sections disponibles sous forme de cartes avec icône,
 * titre et description courte. La sidebar (desktop) est rendue par
 * le layout parent ; cette page sert de point d'entrée et de repli
 * si l'utilisateur arrive directement sur `/parametres`.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.settings.title'),
    robots: { index: false, follow: false },
  };
}

interface SettingsSection {
  key: string;
  href: string;
  icon: string;
  label: string;
  description: string;
  tone?: 'default' | 'danger';
}

export default function SettingsIndexPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const isFr = locale === 'fr';

  const sections: SettingsSection[] = [
    {
      key: 'account',
      href: `/${locale}/parametres/compte`,
      icon: '🔑',
      label: t(messages, 'account.settings.navigation.account'),
      description: isFr
        ? 'Mets à jour ton mot de passe et sécurise ton compte.'
        : 'Update your password and secure your account.',
    },
    {
      key: 'language',
      href: `/${locale}/parametres/langue`,
      icon: '🌐',
      label: t(messages, 'account.settings.navigation.language'),
      description: isFr
        ? "Choisis la langue d'affichage et des e-mails."
        : 'Choose your display language and email language.',
    },
    {
      key: 'data',
      href: `/${locale}/parametres/donnees`,
      icon: '📦',
      label: t(messages, 'account.settings.navigation.data'),
      description: isFr
        ? 'Télécharge une copie de toutes tes données (Loi 25).'
        : 'Download a copy of all your data.',
    },
    {
      key: 'deletion',
      href: `/${locale}/parametres/suppression`,
      icon: '🗑️',
      label: t(messages, 'account.settings.navigation.deletion'),
      description: isFr
        ? 'Supprime définitivement ton compte et toutes tes données.'
        : 'Permanently delete your account and all your data.',
      tone: 'danger',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(messages, 'account.settings.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.settings.subtitle')}
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="group block h-full">
              <Card
                variant="surface"
                padding="lg"
                className={[
                  'h-full transition-all duration-150',
                  s.tone === 'danger'
                    ? 'border-danger-200 group-hover:border-danger-400 group-hover:shadow-sm dark:border-danger-800 group-hover:dark:border-danger-600'
                    : 'group-hover:border-brand-300 group-hover:shadow-sm dark:group-hover:border-brand-700',
                ].join(' ')}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={[
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl',
                      s.tone === 'danger'
                        ? 'bg-danger-50 dark:bg-danger-950/40'
                        : 'bg-brand-50 dark:bg-brand-950/40',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={[
                        'text-sm font-semibold',
                        s.tone === 'danger'
                          ? 'text-danger-700 dark:text-danger-400'
                          : 'text-slate-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300',
                      ].join(' ')}
                    >
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {s.description}
                    </p>
                  </div>
                  <span
                    className={[
                      'ml-auto shrink-0 self-center text-sm transition-transform duration-150 group-hover:translate-x-0.5',
                      s.tone === 'danger'
                        ? 'text-danger-400 dark:text-danger-600'
                        : 'text-slate-400 dark:text-slate-600',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
