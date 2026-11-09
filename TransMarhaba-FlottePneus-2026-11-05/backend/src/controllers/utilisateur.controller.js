const utilisateurService = require('../services/utilisateur.service');

class UtilisateurController {
  async getAll(req, res, next) {
    try {
      const utilisateurs = await utilisateurService.getAllUtilisateurs();
      return res.status(200).json(utilisateurs);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const utilisateur = await utilisateurService.getUtilisateurById(req.params.id);
      return res.status(200).json(utilisateur);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const nouvelUtilisateur = await utilisateurService.createUtilisateur(req.body);
      return res.status(201).json(nouvelUtilisateur);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await utilisateurService.updateUtilisateur(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await utilisateurService.deleteUtilisateur(req.params.id, req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UtilisateurController();
