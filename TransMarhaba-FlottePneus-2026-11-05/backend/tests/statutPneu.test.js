const {
  calculerStatutPneu,
  calculerKmRestant,
  calculerPourcentageUsure,
} = require('../src/utils/statutPneu');

describe('Règle Métier 4 & 5 : Calcul du statut et usure d\'un pneu', () => {
  const DUREE_MAX = 1150; // Valeur par défaut spécifiée

  test('Doit retourner NEUF si kilometrageCumule est égal à 0', () => {
    expect(calculerStatutPneu(0, DUREE_MAX)).toBe('NEUF');
  });

  test('Doit retourner EN_SERVICE si le pourcentage est strictement inférieur à 90 %', () => {
    // 500 / 1150 = ~43.48%
    expect(calculerStatutPneu(500, DUREE_MAX)).toBe('EN_SERVICE');
    // 1034 / 1150 = ~89.91% (< 90%)
    expect(calculerStatutPneu(1034, DUREE_MAX)).toBe('EN_SERVICE');
    // 1 km
    expect(calculerStatutPneu(1, DUREE_MAX)).toBe('EN_SERVICE');
  });

  test('Doit retourner A_REMPLACER si 90 % <= pourcentage < 100 %', () => {
    // 90 % de 1150 = 1035 km
    expect(calculerStatutPneu(1035, DUREE_MAX)).toBe('A_REMPLACER');
    // 1100 km (~95.65%)
    expect(calculerStatutPneu(1100, DUREE_MAX)).toBe('A_REMPLACER');
    // 1149 km (~99.91%)
    expect(calculerStatutPneu(1149, DUREE_MAX)).toBe('A_REMPLACER');
  });

  test('Doit retourner EXPIRE si pourcentage >= 100 %', () => {
    // 1150 km = 100%
    expect(calculerStatutPneu(1150, DUREE_MAX)).toBe('EXPIRE');
    // 1500 km (> 100%)
    expect(calculerStatutPneu(1500, DUREE_MAX)).toBe('EXPIRE');
  });

  test('Doit respecter un seuil personnalisé passé en paramètre ou configuré', () => {
    // Seuil personnalisé à 80% (0.80 * 1000 = 800)
    expect(calculerStatutPneu(799, 1000, 0.80)).toBe('EN_SERVICE');
    expect(calculerStatutPneu(800, 1000, 0.80)).toBe('A_REMPLACER');
    expect(calculerStatutPneu(999, 1000, 0.80)).toBe('A_REMPLACER');
    expect(calculerStatutPneu(1000, 1000, 0.80)).toBe('EXPIRE');
  });

  test('Doit calculer correctement le kilométrage restant : max(0, dureeVieMax - kilometrageCumule)', () => {
    // Pneu neuf
    expect(calculerKmRestant(0, 1150)).toBe(1150);
    // Pneu à mi-vie
    expect(calculerKmRestant(500, 1150)).toBe(650);
    // Pneu à 1150 km
    expect(calculerKmRestant(1150, 1150)).toBe(0);
    // Pneu qui a dépassé sa durée de vie (ne doit jamais être négatif)
    expect(calculerKmRestant(1300, 1150)).toBe(0);
  });

  test('Doit calculer le pourcentage d\'usure arrondi', () => {
    expect(calculerPourcentageUsure(0, 1150)).toBe(0);
    expect(calculerPourcentageUsure(575, 1150)).toBe(50);
    expect(calculerPourcentageUsure(1150, 1150)).toBe(100);
    expect(calculerPourcentageUsure(1500, 1150)).toBe(100); // capped at 100%
  });
});
