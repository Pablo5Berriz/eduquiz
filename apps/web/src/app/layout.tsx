import { DEFAULT_LOCALE, getMessages, t } from '@eduquiz/i18n';

import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { JSX, ReactNode } from 'react';

const messages = getMessages(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: {
    default: t(messages, 'common.appName'),
    template: `%s — ${t(messages, 'common.appName')}`,
  },
  description: t(messages, 'common.tagline'),
  applicationName: t(messages, 'common.appName'),
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Layout racine de l'application.
 *
 * La locale est pour l'instant figée à FR (défaut EduQuiz). Le câblage
 * dynamique (cookie `NEXT_LOCALE` + middleware de détection) viendra
 * avec les écrans du parcours apprenant, à l'étape 1.x.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
