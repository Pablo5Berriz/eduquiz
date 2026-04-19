/**
 * Point d'entrée du paquet @eduquiz/i18n.
 *
 * Les locales FR et EN sont chargées à partir des fichiers JSON du
 * sous-dossier `locales/`. La langue par défaut est le français (FR),
 * avec bascule manuelle persistée côté utilisateur.
 *
 * Le câblage concret (next-intl côté web, i18next côté mobile) sera
 * ajouté à l'étape 0.4 de la Phase 0.
 */

export const DEFAULT_LOCALE = 'fr' as const;
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
