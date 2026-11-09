const pneuService = require('../services/pneu.service');

class PneuController {
  async getAll(req, res, next) {
    try {
      const pneus = await pneuService.getAllPneus(req.query);
      return res.status(200).json(pneus);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const pneu = await pneuService.getPneuById(req.params.id);
      return res.status(200).json(pneu);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const pneu = await pneuService.createPneu(req.body);
      return res.status(201).json(pneu);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const pneu = await pneuService.updatePneu(req.params.id, req.body);
      return res.status(200).json(pneu);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await pneuService.deletePneu(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /camions/:id/pneus
   * Monter un pneu sur un camion à une position donnée
   */
  async monter(req, res, next) {
    try {
      const camionId = req.params.id;
      const { pneuId, position } = req.body;
      const result = await pneuService.monterPneu(camionId, { pneuId, position });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /camions/:camionId/pneus/:pneuId/retirer
   * Démonter un pneu d'un camion avec un motif
   */
  async retirer(req, res, next) {
    try {
      const { camionId, pneuId } = req.params;
      const { motif } = req.body;
      const result = await pneuService.retirerPneu(camionId, pneuId, { motif });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /camions/:camionId/pneus/:pneuId/remplacer
   * Démonter l'ancien pneu et monter le nouveau à la même position
   */
  async remplacer(req, res, next) {
    try {
      const { camionId, pneuId } = req.params;
      const { nouveauPneuId, motif } = req.body;
      const result = await pneuService.remplacerPneu(camionId, pneuId, { nouveauPneuId, motif });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PneuController();
