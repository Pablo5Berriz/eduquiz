/**
 * Calcul du score de maîtrise (mastery) d'une compétence.
 *
 * Algorithme : Exponential Moving Average (EMA) avec α = 0.3.
 * Formule    : mastery = 0.3 × scoreRatio + 0.7 × existingMastery
 *
 * Propriétés :
 *   - Pondère davantage les tentatives récentes (contrairement à la moyenne
 *     arithmétique qui dilue chaque nouvelle note à mesure que N augmente).
 *   - Converge rapidement : après 3 tentatives parfaites sur un score nul, la
 *     maîtrise dépasse 0.6 ; la moyenne arithmétique aurait donné 1.0 dès la
 *     première tentative parfaite sur table vierge, mais plafonne à 0.75 après
 *     plusieurs mauvaises notes préalables.
 *   - Valeur en [0, 1] si scoreRatio ∈ [0, 1] et existingMastery ∈ [0, 1].
 *
 * @param scoreRatio     Score normalisé de la tentative ∈ [0, 1].
 * @param existingMastery Maîtrise courante ∈ [0, 1], ou undefined si première tentative.
 * @returns Nouvelle valeur de maîtrise ∈ [0, 1].
 */
export function computeMastery(scoreRatio: number, existingMastery?: number): number {
  const ALPHA = 0.3;

  if (existingMastery === undefined || existingMastery === null) {
    // Première tentative : la maîtrise initiale est le score brut.
    return scoreRatio;
  }

  return ALPHA * scoreRatio + (1 - ALPHA) * existingMastery;
}
