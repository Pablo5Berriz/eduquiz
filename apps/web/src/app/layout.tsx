import { DEFAULT_LOCALE } from '@eduquiz/i18n';

import './globals.css';

import type { JSX, ReactNode } from 'react';

/**
 * Layout racine ultra-minimal.
 *
 * Next App Router exige la présence de `<html>` et `<body>` dans le
 * layout racine. On applique la locale par défaut (`fr`) sur `<html>`
 * pour satisfaire l'accessibilité (jsx-a11y/html-has-lang) ; le vrai
 * layout bilingue qui porte la `metadata` et réaffirme la locale côté
 * contenu vit dans `app/[locale]/layout.tsx`.
 *
 * Le middleware garantit que toutes les requêtes passent par un
 * segment `[locale]` ; ce layout racine n'est jamais seul à rendre
 * une page. Il sert de rempart pour les rares cas où Next rendrait une
 * page sans `[locale]` (not-found global, erreur globale).
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
