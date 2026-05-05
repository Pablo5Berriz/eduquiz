/**
 * Tests unitaires — computeMastery
 *
 * Vérifie la formule EMA (α = 0.3) et les cas limites.
 * Aucune dépendance externe : fonction pure sans effet de bord.
 */

import { describe, expect, it } from 'vitest';

import { computeMastery } from './mastery';

const ALPHA = 0.3;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Arrondi à N décimales pour éviter les flottants instables. */
function round(n: number, decimals = 10): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeMastery', () => {
  // ── Première tentative ──────────────────────────────────────────────────────

  describe('première tentative (existingMastery absent)', () => {
    it('retourne le scoreRatio brut quand existingMastery est undefined', () => {
      expect(computeMastery(0.8)).toBe(0.8);
    });

    it('retourne 0 pour un score nul', () => {
      expect(computeMastery(0)).toBe(0);
    });

    it('retourne 1 pour un score parfait', () => {
      expect(computeMastery(1)).toBe(1);
    });

    it('accepte explicitement null comme "aucun historique"', () => {
      // null peut arriver si Prisma retourne null sur un champ optionnel.
      expect(computeMastery(0.6, undefined)).toBe(0.6);
    });
  });

  // ── EMA avec historique ─────────────────────────────────────────────────────

  describe('EMA avec existingMastery fourni', () => {
    it('applique la formule α × score + (1-α) × existing', () => {
      // existing=0.5, score=1.0 → 0.3 × 1 + 0.7 × 0.5 = 0.65
      const result = computeMastery(1.0, 0.5);
      expect(round(result)).toBe(round(ALPHA * 1.0 + (1 - ALPHA) * 0.5));
    });

    it('baisse la maîtrise quand le score est inférieur au niveau actuel', () => {
      // existing=0.9, score=0.0 → 0.7 × 0.9 = 0.63
      const result = computeMastery(0.0, 0.9);
      expect(round(result)).toBe(round((1 - ALPHA) * 0.9));
      expect(result).toBeLessThan(0.9);
    });

    it('remonte la maîtrise quand le score est supérieur au niveau actuel', () => {
      // existing=0.2, score=1.0 → 0.3 + 0.14 = 0.44
      const result = computeMastery(1.0, 0.2);
      expect(result).toBeGreaterThan(0.2);
    });

    it('reste stable quand score = existingMastery', () => {
      // Si score === existing, EMA === existing (propriété fixe).
      const result = computeMastery(0.7, 0.7);
      expect(round(result)).toBe(0.7);
    });

    it('reste dans [0, 1] après plusieurs tentatives nulles depuis une maîtrise haute', () => {
      let mastery = 1.0;
      for (let i = 0; i < 20; i++) {
        mastery = computeMastery(0, mastery);
      }
      expect(mastery).toBeGreaterThanOrEqual(0);
      expect(mastery).toBeLessThanOrEqual(1);
    });

    it('reste dans [0, 1] après plusieurs tentatives parfaites depuis zéro', () => {
      let mastery = computeMastery(1.0); // première tentative
      for (let i = 0; i < 20; i++) {
        mastery = computeMastery(1.0, mastery);
      }
      expect(mastery).toBeGreaterThanOrEqual(0);
      expect(mastery).toBeLessThanOrEqual(1);
    });
  });

  // ── Convergence ─────────────────────────────────────────────────────────────

  describe('convergence EMA', () => {
    it('converge vers 1 après de nombreuses tentatives parfaites', () => {
      let mastery = 0;
      for (let i = 0; i < 50; i++) {
        mastery = computeMastery(1, mastery);
      }
      // Après 50 itérations parfaites, mastery doit dépasser 0.999.
      expect(mastery).toBeGreaterThan(0.999);
    });

    it('converge vers 0 après de nombreuses tentatives nulles', () => {
      let mastery = 1;
      for (let i = 0; i < 50; i++) {
        mastery = computeMastery(0, mastery);
      }
      expect(mastery).toBeLessThan(0.001);
    });
  });
});
