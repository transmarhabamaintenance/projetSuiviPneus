const camionService = require('../services/camion.service');

class CamionController {
  async getAll(req, res, next) {
    try {
      const camions = await camionService.getAllCamions();
      return res.status(200).json(camions);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const camion = await camionService.getCamionById(req.params.id);
      return res.status(200).json(camion);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const camion = await camionService.createCamion(req.body);
      return res.status(201).json(camion);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const camion = await camionService.updateCamion(req.params.id, req.body);
      return res.status(200).json(camion);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await camionService.deleteCamion(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /camions/:id/compteur
   * Met à jour le compteur kilométrique du camion et propage l'usure sur ses pneus
   */
  async updateCompteur(req, res, next) {
    try {
      const { nouveauCompteur } = req.body;
      const result = await camionService.updateCompteur(req.params.id, nouveauCompteur);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CamionController();
