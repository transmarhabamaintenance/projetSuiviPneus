const env = require('../config/env');

/**
 * Calcule le statut d'usure d'un pneu selon son kilométrage cumulé et sa durée de vie maximale.
 *
 * Règles :
 * - NEUF : kilometrageCumule = 0
 * - EN_SERVICE : pourcentage < seuil d'alerte (par défaut 90%)
 * - A_REMPLACER : seuil d'alerte ≤ pourcentage < 100%
 * - EXPIRE : pourcentage ≥ 100%
 *
 * @param {number} kilometrageCumule - Kilomètres parcourus au total par le pneu
 * @param {number} dureeVieMax - Durée de vie maximale en km
 * @param {number} [seuilCustom] - Seuil d'alerte optionnel (ex: 0.90)
 * @returns {'NEUF' | 'EN_SERVICE' | 'A_REMPLACER' | 'EXPIRE'}
 */
function calculerStatutPneu(kilometrageCumule, dureeVieMax, seuilCustom = null) {
  const km = Number(kilometrageCumule) || 0;
  const max = Number(dureeVieMax) || env.RULES.DUREE_VIE_MAX_PNEU;
  const seuil = seuilCustom !== null && seuilCustom !== undefined
    ? Number(seuilCustom)
    : env.RULES.SEUIL_ALERTE_USURE;

  if (km === 0) {
    return 'NEUF';
  }

  if (max <= 0) {
    return 'EXPIRE';
  }

  const ratio = km / max;

  if (ratio >= 1.0) {
    return 'EXPIRE';
  }

  if (ratio >= seuil) {
    return 'A_REMPLACER';
  }

  return 'EN_SERVICE';
}

/**
 * Calcule le kilométrage restant pour un pneu : max(0, dureeVieMax - kilometrageCumule)
 *
 * @param {number} kilometrageCumule
 * @param {number} dureeVieMax
 * @returns {number}
 */
function calculerKmRestant(kilometrageCumule, dureeVieMax) {
  const km = Number(kilometrageCumule) || 0;
  const max = Number(dureeVieMax) || env.RULES.DUREE_VIE_MAX_PNEU;
  return Math.max(0, max - km);
}

/**
 * Calcule le pourcentage d'usure (arrondi à 2 décimales)
 *
 * @param {number} kilometrageCumule
 * @param {number} dureeVieMax
 * @returns {number}
 */
function calculerPourcentageUsure(kilometrageCumule, dureeVieMax) {
  const km = Number(kilometrageCumule) || 0;
  const max = Number(dureeVieMax) || env.RULES.DUREE_VIE_MAX_PNEU;
  if (max <= 0) return 100;
  const pct = (km / max) * 100;
  return Math.min(Math.round(pct * 100) / 100, 100);
}

module.exports = {
  calculerStatutPneu,
  calculerKmRestant,
  calculerPourcentageUsure,
};
