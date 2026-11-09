const authService = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, motDePasse } = req.body;
      const result = await authService.login(email, motDePasse);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const utilisateur = await authService.getMe(req.user.id);
      return res.status(200).json(utilisateur);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
