const { withTransaction } = require('../config/db');
const ApiError = require('../utils/apiError');
const camionRepository = require('../repositories/camion.repository');
const pneuRepository = require('../repositories/pneu.repository');
const historiqueRepository = require('../repositories/historique.repository');
const {
  calculerStatutPneu,
  calculerKmRestant,
  calculerPourcentageUsure,
} = require('../utils/statutPneu');

class CamionService {
  /**
   * Liste tous les camions
   */
  async getAllCamions() {
    return camionRepository.findAll();
  }

  /**
   * Récupère un camion par son ID avec ses pneus actifs détaillés
   * (position, kilométrage restant, statut et pourcentage d'usure)
   */
  async getCamionById(id) {
    const camion = await camionRepository.findById(id);
    if (!camion) {
      throw ApiError.notFound(`Camion avec l'ID ${id} non trouvé`);
    }

    const pneusActifs = await camionRepository.findPneusActifs(id);

    const pneusFormates = pneusActifs.map((item) => ({
      historiqueId: item.historique_id,
      position: item.position,
      dateInstallation: item.dateInstallation,
      compteurCamionDebut: item.compteurCamionDebut,
      compteurCamionFin: item.compteurCamionFin,
      kmParcourusSurCeCamion: item.kmParcourus,
      pneu: {
        id: item.pneu_id,
        reference: item.reference,
        marque: item.marque,
        dureeVieMax: item.dureeVieMax,
        kilometrageCumule: item.kilometrageCumule,
        statut: item.statut,
        kilometrageRestant: calculerKmRestant(item.kilometrageCumule, item.dureeVieMax),
        pourcentageUsure: calculerPourcentageUsure(item.kilometrageCumule, item.dureeVieMax),
      },
    }));

    return {
      ...camion,
      pneus: pneusFormates,
    };
  }

  /**
   * Création d'un camion
   * Règle métier 1 : compteurActuel = compteurInitial
   */
  async createCamion({ immatriculation, marque, modele, compteurInitial }) {
    const existing = await camionRepository.findByImmatriculation(immatriculation);
    if (existing) {
      throw ApiError.conflict(`Un camion avec l'immatriculation ${immatriculation} existe déjà`);
    }

    const kmInitial = Number(compteurInitial);
    if (isNaN(kmInitial) || kmInitial < 0) {
      throw ApiError.badRequest('Le compteur initial doit être un nombre positif ou nul');
    }

    return camionRepository.create({
      immatriculation: immatriculation.trim().toUpperCase(),
      marque: marque.trim(),
      modele: modele.trim(),
      compteurInitial: kmInitial,
      compteurActuel: kmInitial, // Règle 1
    });
  }

  /**
   * Mise à jour d'un camion (infos générales)
   */
  async updateCamion(id, { immatriculation, marque, modele }) {
    const camion = await camionRepository.findById(id);
    if (!camion) {
      throw ApiError.notFound(`Camion avec l'ID ${id} non trouvé`);
    }

    if (immatriculation && immatriculation !== camion.immatriculation) {
      const existing = await camionRepository.findByImmatriculation(immatriculation);
      if (existing && existing.id !== Number(id)) {
        throw ApiError.conflict(`Un camion avec l'immatriculation ${immatriculation} existe déjà`);
      }
    }

    return camionRepository.update(id, {
      immatriculation: (immatriculation || camion.immatriculation).trim().toUpperCase(),
      marque: (marque || camion.marque).trim(),
      modele: (modele || camion.modele).trim(),
    });
  }

  /**
   * Suppression d'un camion
   */
  async deleteCamion(id) {
    const camion = await camionRepository.findById(id);
    if (!camion) {
      throw ApiError.notFound(`Camion avec l'ID ${id} non trouvé`);
    }

    const pneusActifs = await camionRepository.findPneusActifs(id);
    if (pneusActifs.length > 0) {
      throw ApiError.badRequest(
        'Impossible de supprimer ce camion car des pneus y sont actuellement montés. Veuillez d\'abord les retirer.'
      );
    }

    await camionRepository.delete(id);
    return { message: 'Camion supprimé avec succès' };
  }

  /**
   * Mise à jour du compteur d'un camion (après un voyage ou une correction de saisie)
   *
   * Règle métier 3 :
   * - Toute valeur de compteur ≥ 0 est acceptée, y compris inférieure au compteur actuel.
   * - delta = nouveauCompteur − ancienCompteur (peut être négatif).
   * - Pour chaque pneu actif du camion :
   *     kilometrageCumule += delta, plafonné à 0,
   *     mettre à jour kmParcourus et compteurCamionFin dans l'Historique actif,
   *     puis recalculer le statut.
   * - Tout dans UNE SEULE transaction MySQL.
   *
   * @param {number} id - ID du camion
   * @param {number} nouveauCompteur - Valeur du nouveau compteur kilométrique
   */
  async updateCompteur(id, nouveauCompteur) {
    const km = Number(nouveauCompteur);
    if (isNaN(km)) {
      throw ApiError.badRequest('Le nouveau compteur doit être un nombre valide');
    }

    return withTransaction(async (conn) => {
      // 1. Récupération avec verrouillage
      const camion = await camionRepository.findById(id, conn);
      if (!camion) {
        throw ApiError.notFound(`Camion avec l'ID ${id} non trouvé`);
      }

      // Règle 3.1 : delta = nouveauCompteur − ancienCompteur (négatif si correction de saisie)
      const delta = km - camion.compteurActuel;

      // Mise à jour du compteur actuel du camion
      await camionRepository.updateCompteur(id, km, conn);

      // Récupération des pneus actifs montés sur le camion
      const montagesActifs = await camionRepository.findPneusActifs(id, conn);

      // Règle 3.2 : Pour chaque pneu actif du camion, l'usure ne descend jamais sous 0 km
      for (const montage of montagesActifs) {
        const nouveauKmCumule = Math.max(0, montage.kilometrageCumule + delta);
        const nouveauStatut = calculerStatutPneu(nouveauKmCumule, montage.dureeVieMax);

        // Mise à jour du pneu
        await pneuRepository.updateKilometrageEtStatut(
          montage.pneu_id,
          nouveauKmCumule,
          nouveauStatut,
          conn
        );

        // Mise à jour de l'Historique actif
        // kmParcourus cumulés sur ce montage = km - compteurCamionDebut
        const kmTotalCeMontage = Math.max(0, km - montage.compteurCamionDebut);
        await historiqueRepository.mettreAJourKmMontage(
          montage.historique_id,
          {
            compteurCamionFin: km,
            kmParcourus: kmTotalCeMontage,
          },
          conn
        );
      }

      return {
        message: 'Compteur mis à jour avec succès',
        ancienCompteur: camion.compteurActuel,
        nouveauCompteur: km,
        deltaKm: delta,
        nbPneusImpactes: montagesActifs.length,
      };
    });
  }
}

module.exports = new CamionService();
