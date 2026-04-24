/**
 * Source de vérité de la liste des matières affichées dans la vitrine.
 *
 * Le catalogue reste volontairement en dur côté application Web tant que
 * la table `Subject` côté DB n'est pas exposée publiquement (elle le
 * sera en Phase 1.6 quand les parcours d'apprentissage ouvriront). À ce
 * stade on mutualise simplement les slugs et les clés i18n pour que les
 * pages Matières (hub + détail) et la Home restent synchronisées.
 */

import { t, type Messages } from '@eduquiz/i18n';

/** Clé de matière dans le dictionnaire i18n (`subjects.list.<key>`). */
export const SUBJECT_KEYS = [
  'mathematiques',
  'francais',
  'anglais',
  'sciencesTechnologie',
  'histoireQuebecCanada',
  'geographie',
  'educationFinanciere',
  'educationPhysiqueSante',
  'cultureCitoyenneteQuebecoise',
  'mondeContemporain',
] as const;

/**
 * Niveaux pédagogiques utilisés pour la section « Ce que tu apprends,
 * niveau par niveau » sur la page détail. L'ordre est l'ordre de lecture.
 */
export const LEVEL_KEYS = ['p3p4', 'p5p6', 's1', 's2', 's3', 's4', 's5'] as const;

export type LevelKey = (typeof LEVEL_KEYS)[number];

/** Mapping clé niveau → clé i18n (`subjects.detail.level<KEY>`). */
export const LEVEL_LABEL_KEY: Record<LevelKey, string> = {
  p3p4: 'subjects.detail.levelP3P4',
  p5p6: 'subjects.detail.levelP5P6',
  s1: 'subjects.detail.levelS1',
  s2: 'subjects.detail.levelS2',
  s3: 'subjects.detail.levelS3',
  s4: 'subjects.detail.levelS4',
  s5: 'subjects.detail.levelS5',
};

export type SubjectKey = (typeof SUBJECT_KEYS)[number];

/**
 * Slug utilisé dans l'URL. On récupère depuis le dictionnaire pour
 * laisser la possibilité de slugs localisés plus tard (actuellement
 * identiques en FR et en EN pour simplifier le SEO multilingue).
 */
export function getSubjectSlug(messages: Messages, key: SubjectKey): string {
  return t(messages, `subjects.list.${key}.slug`);
}

/**
 * Résout une clé de matière depuis un slug. Utilisé par la route
 * dynamique `/[locale]/matieres/[subject]` pour valider le paramètre.
 */
export function resolveSubjectKeyFromSlug(
  messages: Messages,
  slug: string,
): SubjectKey | undefined {
  return SUBJECT_KEYS.find((key) => getSubjectSlug(messages, key) === slug);
}
