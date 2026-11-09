// Mock du module db pour intercepter withTransaction
jest.mock('../src/config/db', () => ({
  withTransaction: jest.fn(async (cb) => {
    const mockConn = {};
    return cb(mockConn);
  }),
  pool: {
    query: jest.fn(),
    execute: jest.fn(),
  },
}));

// Mock des repositories
jest.mock('../src/repositories/camion.repository');
jest.mock('../src/repositories/pneu.repository');
jest.mock('../src/repositories/historique.repository');

const camionRepository = require('../src/repositories/camion.repository');
const pneuRepository = require('../src/repositories/pneu.repository');
const historiqueRepository = require('../src/repositories/historique.repository');
const camionService = require('../src/services/camion.service');

describe('Règle Métier 3 : Mise à jour du compteur d\'un camion après voyage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Doit accepter un compteur inférieur à l\'actuel (correction de saisie) et plafonner l\'usure à 0', async () => {
    camionRepository.findById.mockResolvedValue({
      id: 1,
      immatriculation: 'AA-123-AA',
      compteurActuel: 50000,
    });

    // 2 pneus actifs :
    // Pneu A : 900 km, retrait de 200 km -> 700 km -> EN_SERVICE
    // Pneu B : 50 km, retrait de 200 km -> -150 -> plafonné à 0 km -> NEUF
    camionRepository.findPneusActifs.mockResolvedValue([
      {
        historique_id: 10,
        pneu_id: 101,
        position: 'AVG',
        compteurCamionDebut: 49500,
        kilometrageCumule: 900,
        dureeVieMax: 1150,
        statut: 'EN_SERVICE',
      },
      {
        historique_id: 11,
        pneu_id: 102,
        position: 'AVD',
        compteurCamionDebut: 49900,
        kilometrageCumule: 50,
        dureeVieMax: 1150,
        statut: 'EN_SERVICE',
      },
    ]);

    // Nouveau compteur : 49 800 km (delta = -200 km)
    const resultat = await camionService.updateCompteur(1, 49800);

    expect(resultat).toEqual({
      message: 'Compteur mis à jour avec succès',
      ancienCompteur: 50000,
      nouveauCompteur: 49800,
      deltaKm: -200,
      nbPneusImpactes: 2,
    });

    expect(camionRepository.updateCompteur).toHaveBeenCalledWith(1, 49800, expect.anything());

    // Pneu 101 : 900 - 200 = 700 km -> EN_SERVICE, kmParcourus = 49800 - 49500 = 300 km
    expect(pneuRepository.updateKilometrageEtStatut).toHaveBeenCalledWith(
      101,
      700,
      'EN_SERVICE',
      expect.anything()
    );
    expect(historiqueRepository.mettreAJourKmMontage).toHaveBeenCalledWith(
      10,
      {
        compteurCamionFin: 49800,
        kmParcourus: 300,
      },
      expect.anything()
    );

    // Pneu 102 : usure plafonnée à 0 km -> NEUF, et kmParcourus jamais négatif
    expect(pneuRepository.updateKilometrageEtStatut).toHaveBeenCalledWith(
      102,
      0,
      'NEUF',
      expect.anything()
    );
    expect(historiqueRepository.mettreAJourKmMontage).toHaveBeenCalledWith(
      11,
      {
        compteurCamionFin: 49800,
        kmParcourus: 0,
      },
      expect.anything()
    );
  });

  test('Doit calculer le delta, mettre à jour le compteur du camion, l\'usure et le statut des pneus actifs', async () => {
    // Camion à 50 000 km
    camionRepository.findById.mockResolvedValue({
      id: 1,
      immatriculation: 'AA-123-AA',
      compteurActuel: 50000,
    });

    // 2 pneus actifs :
    // Pneu A : 900 km, durée 1150. Avec 150 km de plus -> 1050 km -> passe en A_REMPLACER (>= 90%)
    // Pneu B : 1100 km, durée 1150. Avec 150 km de plus -> 1250 km -> passe en EXPIRE (>= 100%)
    camionRepository.findPneusActifs.mockResolvedValue([
      {
        historique_id: 10,
        pneu_id: 101,
        position: 'AVG',
        compteurCamionDebut: 49500,
        kilometrageCumule: 900,
        dureeVieMax: 1150,
        statut: 'EN_SERVICE',
      },
      {
        historique_id: 11,
        pneu_id: 102,
        position: 'AVD',
        compteurCamionDebut: 49800,
        kilometrageCumule: 1100,
        dureeVieMax: 1150,
        statut: 'A_REMPLACER',
      },
    ]);

    // Nouveau compteur : 50 150 km (delta = +150 km)
    const resultat = await camionService.updateCompteur(1, 50150);

    expect(resultat).toEqual({
      message: 'Compteur mis à jour avec succès',
      ancienCompteur: 50000,
      nouveauCompteur: 50150,
      deltaKm: 150,
      nbPneusImpactes: 2,
    });

    // Vérification de la mise à jour du camion
    expect(camionRepository.updateCompteur).toHaveBeenCalledWith(1, 50150, expect.anything());

    // Vérification du Pneu 101 : 900 + 150 = 1050 km -> statut A_REMPLACER
    expect(pneuRepository.updateKilometrageEtStatut).toHaveBeenCalledWith(
      101,
      1050,
      'A_REMPLACER',
      expect.anything()
    );

    // Vérification de l'historique Pneu 101 : nouveau compteurFin = 50150, kmParcourus = 50150 - 49500 = 650 km
    expect(historiqueRepository.mettreAJourKmMontage).toHaveBeenCalledWith(
      10,
      {
        compteurCamionFin: 50150,
        kmParcourus: 650,
      },
      expect.anything()
    );

    // Vérification du Pneu 102 : 1100 + 150 = 1250 km -> statut EXPIRE
    expect(pneuRepository.updateKilometrageEtStatut).toHaveBeenCalledWith(
      102,
      1250,
      'EXPIRE',
      expect.anything()
    );

    // Vérification de l'historique Pneu 102 : kmParcourus = 50150 - 49800 = 350 km
    expect(historiqueRepository.mettreAJourKmMontage).toHaveBeenCalledWith(
      11,
      {
        compteurCamionFin: 50150,
        kmParcourus: 350,
      },
      expect.anything()
    );
  });
});
