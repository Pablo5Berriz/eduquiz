import { getMessages, t } from '@eduquiz/i18n';
import { Button, Card } from '@eduquiz/ui';
import Link from 'next/link';

import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Écran 37 — Export de mes données (Loi 25).
 *
 * Le téléchargement passe par une Route Handler dédiée
 * (`/api/account/export`) qui renvoie un JSON immédiat avec
 * `Content-Disposition: attachment`. Pas de Server Action ici (les
 * Server Actions retournent du JSON sérialisable, pas un Blob).
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'account.dataExport.title'),
    robots: { index: false, follow: false },
  };
}

export default function DataExportPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(messages, 'account.dataExport.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t(messages, 'account.dataExport.subtitle')}
      </p>

      <Card variant="surface" padding="lg" className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t(messages, 'account.dataExport.includes.heading')}
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-200">
          {(['profile', 'activity', 'consents', 'audit', 'requests'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
              <span>{t(messages, `account.dataExport.includes.${k}`)}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {t(messages, 'account.dataExport.formatLabel')}
          </span>{' '}
          <span className="text-slate-600 dark:text-slate-300">
            · {t(messages, 'account.dataExport.formatJson')}
          </span>
        </p>

        <div className="mt-6">
          <Link
            href={`/api/account/export?locale=${locale}`}
            prefetch={false}
            // Force un téléchargement plutôt qu'une navigation : la
            // Route Handler renvoie `Content-Disposition: attachment`.
            download
            className="inline-flex"
          >
            <Button variant="primary" size="md">
              {t(messages, 'account.dataExport.downloadCta')}
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t(messages, 'account.dataExport.note')}
        </p>
      </Card>
    </div>
  );
}
