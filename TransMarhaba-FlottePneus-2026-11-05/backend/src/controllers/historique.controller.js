const historiqueService = require('../services/historique.service');

class HistoriqueController {
  async getAll(req, res, next) {
    try {
      const { camionId, pneuId, actif } = req.query;
      const filtres = {};
      if (camionId) filtres.camionId = Number(camionId);
      if (pneuId) filtres.pneuId = Number(pneuId);
      if (actif !== undefined) filtres.actif = actif;

      const historique = await historiqueService.getAllHistorique(filtres);
      return res.status(200).json(historique);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HistoriqueController();
