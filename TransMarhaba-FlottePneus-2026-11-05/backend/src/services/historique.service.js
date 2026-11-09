const historiqueRepository = require('../repositories/historique.repository');
const { calculerKmRestant, calculerPourcentageUsure } = require('../utils/statutPneu');

class HistoriqueService {
  /**
   * Récupère la liste filtrable des historiques de montage/démontage
   * @param {{ camionId?: number, pneuId?: number, actif?: boolean }} filtres
   */
  async getAllHistorique(filtres = {}) {
    const list = await historiqueRepository.findAll(filtres);
    return list.map((item) => ({
      ...item,
      pneuKilometrageRestant: calculerKmRestant(item.pneu_kilometrageCumule, item.pneu_dureeVieMax),
      pneuPourcentageUsure: calculerPourcentageUsure(item.pneu_kilometrageCumule, item.pneu_dureeVieMax),
    }));
  }
}

module.exports = new HistoriqueService();
