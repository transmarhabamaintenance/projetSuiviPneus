const { withTransaction } = require('../config/db');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const pneuRepository = require('../repositories/pneu.repository');
const camionRepository = require('../repositories/camion.repository');
const historiqueRepository = require('../repositories/historique.repository');
const {
  calculerStatutPneu,
  calculerKmRestant,
  calculerPourcentageUsure,
} = require('../utils/statutPneu');

class PneuService {
  /**
   * Récupère tous les pneus avec calculs de vie restante
   */
  async getAllPneus(filtres = {}) {
    const pneus = await pneuRepository.findAll(filtres);
    return pneus.map((pneu) => ({
      ...pneu,
      kilometrageRestant: calculerKmRestant(pneu.kilometrageCumule, pneu.dureeVieMax),
      pourcentageUsure: calculerPourcentageUsure(pneu.kilometrageCumule, pneu.dureeVieMax),
      estMonte: Boolean(pneu.montage_actif_id),
    }));
  }

  /**
   * Récupère un pneu avec son historique complet de montages
   */
  async getPneuById(id) {
    const pneu = await pneuRepository.findById(id);
    if (!pneu) {
      throw ApiError.notFound(`Pneu avec l'ID ${id} non trouvé`);
    }

    const historique = await historiqueRepository.findByPneu(id);

    return {
      ...pneu,
      kilometrageRestant: calculerKmRestant(pneu.kilometrageCumule, pneu.dureeVieMax),
      pourcentageUsure: calculerPourcentageUsure(pneu.kilometrageCumule, pneu.dureeVieMax),
      estMonte: Boolean(pneu.montage_actif_id),
      historique,
    };
  }

  /**
   * Création d'un pneu
   * Règle métier :
   * - dureeVieMax par défaut = 1150 (depuis env)
   * - kilometrageCumule par défaut = 0 (modifiable si pneu d'occasion)
   * - statut calculé automatiquement
   */
  async createPneu({ reference, marque, dureeVieMax, kilometrageCumule }) {
    const refClean = reference.trim().toUpperCase();
    const existing = await pneuRepository.findByReference(refClean);
    if (existing) {
      throw ApiError.conflict(`Un pneu avec la référence ${refClean} existe déjà`);
    }

    const max = Number(dureeVieMax) > 0 ? Number(dureeVieMax) : env.RULES.DUREE_VIE_MAX_PNEU;
    const kmCumule = Number(kilometrageCumule) >= 0 ? Number(kilometrageCumule) : 0;
    const statut = calculerStatutPneu(kmCumule, max);

    const nouveauPneu = await pneuRepository.create({
      reference: refClean,
      marque: marque.trim(),
      dureeVieMax: max,
      kilometrageCumule: kmCumule,
      statut,
    });

    return {
      ...nouveauPneu,
      kilometrageRestant: calculerKmRestant(nouveauPneu.kilometrageCumule, nouveauPneu.dureeVieMax),
      pourcentageUsure: calculerPourcentageUsure(nouveauPneu.kilometrageCumule, nouveauPneu.dureeVieMax),
    };
  }

  /**
   * Mise à jour d'un pneu
   */
  async updatePneu(id, { reference, marque, dureeVieMax, kilometrageCumule }) {
    const pneu = await pneuRepository.findById(id);
    if (!pneu) {
      throw ApiError.notFound(`Pneu avec l'ID ${id} non trouvé`);
    }

    if (reference && reference.trim().toUpperCase() !== pneu.reference) {
      const refClean = reference.trim().toUpperCase();
      const existing = await pneuRepository.findByReference(refClean);
      if (existing && existing.id !== Number(id)) {
        throw ApiError.conflict(`Un pneu avec la référence ${refClean} existe déjà`);
      }
    }

    const nouveauMax = dureeVieMax !== undefined ? Number(dureeVieMax) : pneu.dureeVieMax;
    const nouveauKm = kilometrageCumule !== undefined ? Number(kilometrageCumule) : pneu.kilometrageCumule;
    const nouveauStatut = calculerStatutPneu(nouveauKm, nouveauMax);

    const updated = await pneuRepository.update(id, {
      reference: reference ? reference.trim().toUpperCase() : undefined,
      marque: marque ? marque.trim() : undefined,
      dureeVieMax: nouveauMax,
      kilometrageCumule: nouveauKm,
      statut: nouveauStatut,
    });

    return {
      ...updated,
      kilometrageRestant: calculerKmRestant(updated.kilometrageCumule, updated.dureeVieMax),
      pourcentageUsure: calculerPourcentageUsure(updated.kilometrageCumule, updated.dureeVieMax),
    };
  }

  /**
   * Suppression d'un pneu
   */
  async deletePneu(id) {
    const pneu = await pneuRepository.findById(id);
    if (!pneu) {
      throw ApiError.notFound(`Pneu avec l'ID ${id} non trouvé`);
    }

    const montageActif = await pneuRepository.findMontageActif(id);
    if (montageActif) {
      throw ApiError.badRequest(
        `Impossible de supprimer ce pneu : il est actuellement monté sur le camion ${montageActif.camion_immatriculation} (position ${montageActif.position})`
      );
    }

    await pneuRepository.delete(id);
    return { message: 'Pneu supprimé avec succès' };
  }

  /**
   * Règle métier 2 : Montage d'un pneu sur un camion
   * - créer une ligne Historique avec position, compteurCamionDebut = compteurActuel, dateRetrait = NULL.
   * - refuser si le pneu est déjà monté ailleurs.
   * - refuser si la position est occupée sur ce camion.
   */
  async monterPneu(camionId, { pneuId, position }) {
    if (!position || !pneuId) {
      throw ApiError.badRequest('La position et l\'ID du pneu sont requis');
    }

    const pos = position.trim().toUpperCase();

    return withTransaction(async (conn) => {
      // 1. Vérification du camion
      const camion = await camionRepository.findById(camionId, conn);
      if (!camion) {
        throw ApiError.notFound(`Camion avec l'ID ${camionId} non trouvé`);
      }

      // 2. Vérification du pneu
      const pneu = await pneuRepository.findById(pneuId, conn);
      if (!pneu) {
        throw ApiError.notFound(`Pneu avec l'ID ${pneuId} non trouvé`);
      }

      // 3. Refuser si le pneu est déjà monté ailleurs
      const montageActifPneu = await historiqueRepository.findActifByPneu(pneuId, conn);
      if (montageActifPneu) {
        throw ApiError.conflict(
          `Le pneu ${pneu.reference} est déjà monté sur le camion ID ${montageActifPneu.camion_id} à la position ${montageActifPneu.position}`
        );
      }

      // 4. Refuser si la position est déjà occupée sur ce camion
      const positionOccupee = await historiqueRepository.findActifByCamionEtPosition(camionId, pos, conn);
      if (positionOccupee) {
        throw ApiError.conflict(
          `La position ${pos} est déjà occupée par le pneu ID ${positionOccupee.pneu_id} sur ce camion`
        );
      }

      // 5. Création de l'Historique
      const montage = await historiqueRepository.creerMontage(
        {
          camion_id: Number(camionId),
          pneu_id: Number(pneuId),
          position: pos,
          compteurCamionDebut: camion.compteurActuel,
        },
        conn
      );

      return {
        message: `Pneu ${pneu.reference} monté avec succès en position ${pos} sur le camion ${camion.immatriculation}`,
        montage,
      };
    });
  }

  /**
   * Règle métier 6 : Démontage d'un pneu
   * - clôturer l'Historique actif (dateRetrait = NOW(), compteurCamionFin = compteurActuel, motifRetrait)
   */
  async retirerPneu(camionId, pneuId, { motif }) {
    if (!motif || motif.trim() === '') {
      throw ApiError.badRequest('Un motif de retrait est obligatoire pour démonter un pneu');
    }

    return withTransaction(async (conn) => {
      const camion = await camionRepository.findById(camionId, conn);
      if (!camion) {
        throw ApiError.notFound(`Camion avec l'ID ${camionId} non trouvé`);
      }

      const pneu = await pneuRepository.findById(pneuId, conn);
      if (!pneu) {
        throw ApiError.notFound(`Pneu avec l'ID ${pneuId} non trouvé`);
      }

      // Recherche du montage actif pour ce camion et ce pneu
      const [rows] = await conn.query(
        'SELECT * FROM Historique WHERE camion_id = ? AND pneu_id = ? AND dateRetrait IS NULL LIMIT 1',
        [camionId, pneuId]
      );
      const montageActif = rows[0];

      if (!montageActif) {
        throw ApiError.badRequest(
          `Le pneu ${pneu.reference} n'est pas actuellement monté sur le camion ${camion.immatriculation}`
        );
      }

      const kmParcourusCeMontage = camion.compteurActuel - montageActif.compteurCamionDebut;

      const montageCloture = await historiqueRepository.cloturerMontage(
        montageActif.id,
        {
          compteurCamionFin: camion.compteurActuel,
          kmParcourus: Math.max(0, kmParcourusCeMontage),
          motifRetrait: motif.trim(),
        },
        conn
      );

      return {
        message: `Pneu ${pneu.reference} retiré du camion ${camion.immatriculation}`,
        historique: montageCloture,
      };
    });
  }

  /**
   * Règle métier 7 : Remplacement d'un pneu
   * - démonter l'ancien (motif obligatoire) et monter le nouveau à la même position
   * - Tout dans UNE SEULE transaction MySQL.
   */
  async remplacerPneu(camionId, ancienPneuId, { nouveauPneuId, motif }) {
    if (!motif || motif.trim() === '') {
      throw ApiError.badRequest('Un motif est obligatoire pour remplacer un pneu');
    }
    if (!nouveauPneuId) {
      throw ApiError.badRequest('L\'identifiant du nouveau pneu est obligatoire');
    }
    if (Number(ancienPneuId) === Number(nouveauPneuId)) {
      throw ApiError.badRequest('Le nouveau pneu doit être différent de l\'ancien pneu');
    }

    return withTransaction(async (conn) => {
      // 1. Vérification du camion
      const camion = await camionRepository.findById(camionId, conn);
      if (!camion) {
        throw ApiError.notFound(`Camion avec l'ID ${camionId} non trouvé`);
      }

      // 2. Vérification du montage actif de l'ancien pneu
      const [rows] = await conn.query(
        'SELECT * FROM Historique WHERE camion_id = ? AND pneu_id = ? AND dateRetrait IS NULL LIMIT 1',
        [camionId, ancienPneuId]
      );
      const ancienMontage = rows[0];

      if (!ancienMontage) {
        throw ApiError.badRequest(
          `Aucun montage actif trouvé pour le pneu ID ${ancienPneuId} sur le camion ${camion.immatriculation}`
        );
      }

      const position = ancienMontage.position;

      // 3. Vérification du nouveau pneu
      const nouveauPneu = await pneuRepository.findById(nouveauPneuId, conn);
      if (!nouveauPneu) {
        throw ApiError.notFound(`Nouveau pneu avec l'ID ${nouveauPneuId} non trouvé`);
      }

      // 4. Vérifier que le nouveau pneu n'est pas déjà monté ailleurs
      const nouveauEstMonte = await historiqueRepository.findActifByPneu(nouveauPneuId, conn);
      if (nouveauEstMonte) {
        throw ApiError.conflict(
          `Le nouveau pneu ${nouveauPneu.reference} est déjà monté sur un autre camion (ou position)`
        );
      }

      // 5. Clôture de l'ancien montage
      const kmParcourus = camion.compteurActuel - ancienMontage.compteurCamionDebut;
      await historiqueRepository.cloturerMontage(
        ancienMontage.id,
        {
          compteurCamionFin: camion.compteurActuel,
          kmParcourus: Math.max(0, kmParcourus),
          motifRetrait: motif.trim(),
        },
        conn
      );

      // 6. Création du nouveau montage à la même position
      const nouveauMontage = await historiqueRepository.creerMontage(
        {
          camion_id: Number(camionId),
          pneu_id: Number(nouveauPneuId),
          position,
          compteurCamionDebut: camion.compteurActuel,
        },
        conn
      );

      return {
        message: `Remplacement effectué avec succès : pneu ${nouveauPneu.reference} installé à la position ${position}`,
        ancienMontageClotureId: ancienMontage.id,
        nouveauMontage,
      };
    });
  }
}

module.exports = new PneuService();
