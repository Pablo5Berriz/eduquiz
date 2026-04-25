/**
 * Source de vérité de la liste des niveaux scolaires affichés dans la
 * vitrine publique (section « Niveaux scolaires » de la home + pages
 * détail `/[locale]/niveaux/[level]`).
 *
 * Les niveaux individuels sont au nombre de neuf (3e année du primaire
 * → 5e secondaire). Chacun est rattaché à un « regroupement matières »
 * (`p3p4`, `p5p6`, `s1` … `s5`) qui correspond à la granularité utilisée
 * dans `subjects.list.<key>.byLevel.<group>` du dictionnaire i18n. Ce
 * mapping permet, sur la page détail d'un niveau, de lister les
 * matières effectivement au programme et de pointer vers leurs fiches.
 *
 * Catalogue gardé en dur tant que les tables `Level` / `Subject` ne sont
 * pas exposées publiquement côté DB (Phase 1.6+).
 */

import { t, tList, type Messages } from '@eduquiz/i18n';

import { SUBJECT_KEYS, type SubjectKey, type LevelKey } from './subjects';

/**
 * Clés de niveau scolaire dans le dictionnaire i18n
 * (`levels.list.<key>`). L'ordre est l'ordre pédagogique (du plus jeune
 * au plus âgé) et donc l'ordre de rendu en grille.
 */
export const SCHOOL_LEVEL_KEYS = [
  'primaire3',
  'primaire4',
  'primaire5',
  'primaire6',
  'secondaire1',
  'secondaire2',
  'secondaire3',
  'secondaire4',
  'secondaire5',
] as const;

export type SchoolLevelKey = (typeof SCHOOL_LEVEL_KEYS)[number];

/**
 * Mapping niveau scolaire individuel → regroupement matières utilisé
 * dans `subjects.list.<subject>.byLevel.<group>`. Deux niveaux du
 * primaire partagent le même regroupement (cycle), les niveaux du
 * secondaire ont un regroupement par année.
 */
export const SCHOOL_LEVEL_TO_SUBJECT_GROUP: Record<SchoolLevelKey, LevelKey> = {
  primaire3: 'p3p4',
  primaire4: 'p3p4',
  primaire5: 'p5p6',
  primaire6: 'p5p6',
  secondaire1: 's1',
  secondaire2: 's2',
  secondaire3: 's3',
  secondaire4: 's4',
  secondaire5: 's5',
};

/**
 * Slug d'URL d'un niveau scolaire. Lu depuis le dictionnaire i18n pour
 * permettre des slugs localisés (FR : `primaire-3`, `secondaire-1` ;
 * EN : `grade-3`, `secondary-1`).
 */
export function getSchoolLevelSlug(messages: Messages, key: SchoolLevelKey): string {
  return t(messages, `levels.list.${key}.slug`);
}

/**
 * Résolution inverse pour la route dynamique
 * `/[locale]/niveaux/[level]`. Retourne `undefined` si le slug n'est
 * pas reconnu (la route doit alors appeler `notFound()`).
 */
export function resolveSchoolLevelKeyFromSlug(
  messages: Messages,
  slug: string,
): SchoolLevelKey | undefined {
  return SCHOOL_LEVEL_KEYS.find((key) => getSchoolLevelSlug(messages, key) === slug);
}

/**
 * Renvoie la liste des matières effectivement au programme à un niveau
 * donné, sous forme de clés. On considère qu'une matière « est au
 * programme » dès lors que sa clé i18n
 * `subjects.list.<subject>.byLevel.<group>` contient au moins un
 * élément. Ce calcul reste léger (10 lookups × 1 niveau).
 */
export function getSubjectsForSchoolLevel(
  messages: Messages,
  key: SchoolLevelKey,
): readonly SubjectKey[] {
  const group = SCHOOL_LEVEL_TO_SUBJECT_GROUP[key];
  return SUBJECT_KEYS.filter(
    (subjectKey) => tList(messages, `subjects.list.${subjectKey}.byLevel.${group}`).length > 0,
  );
}
