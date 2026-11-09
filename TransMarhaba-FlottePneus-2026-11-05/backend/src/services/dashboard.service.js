const camionRepository = require('../repositories/camion.repository');
const pneuRepository = require('../repositories/pneu.repository');
const { calculerKmRestant, calculerPourcentageUsure } = require('../utils/statutPneu');

class DashboardService {
  /**
   * Récupère toutes les statistiques consolidées pour le tableau de bord
   */
  async getDashboardData() {
    const camions = await camionRepository.findAll();
    const pneusParStatut = await pneuRepository.countByStatut();
    const pneusAlertesRaw = await pneuRepository.findAlertes();

    const totalPneus = Object.values(pneusParStatut).reduce((acc, curr) => acc + curr, 0);

    const pneusAlertes = pneusAlertesRaw.map((p) => ({
      ...p,
      kilometrageRestant: calculerKmRestant(p.kilometrageCumule, p.dureeVieMax),
      pourcentageUsure: calculerPourcentageUsure(p.kilometrageCumule, p.dureeVieMax),
      estMonte: Boolean(p.montage_actif_id),
    }));

    return {
      totalCamions: camions.length,
      totalPneus,
      pneusParStatut,
      alertesCount: pneusAlertes.length,
      pneusAlertes, // Liste des pneus A_REMPLACER et EXPIRE
    };
  }
}

module.exports = new DashboardService();
