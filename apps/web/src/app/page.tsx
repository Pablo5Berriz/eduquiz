import { DEFAULT_LOCALE } from '@eduquiz/i18n';
import { redirect } from 'next/navigation';

/**
 * Filet de sécurité pour les requêtes `/` qui n'auraient pas été
 * interceptées par le middleware (par exemple en mode edge runtime
 * explicitement désactivé). On redirige vers la locale par défaut ;
 * en pratique cette page ne devrait jamais être rendue grâce au
 * middleware.
 */
export default function RootPage(): never {
  redirect(`/${DEFAULT_LOCALE}`);
}
