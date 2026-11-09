const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const utilisateurRepository = require('../repositories/utilisateur.repository');

class AuthService {
  /**
   * Connexion utilisateur
   * @param {string} email
   * @param {string} motDePasse
   */
  async login(email, motDePasse) {
    if (!email || !motDePasse) {
      throw ApiError.badRequest('Email et mot de passe sont obligatoires');
    }

    const utilisateur = await utilisateurRepository.findByEmailWithPassword(email);
    if (!utilisateur) {
      throw ApiError.unauthorized('Identifiants incorrects (email ou mot de passe invalide)');
    }

    const match = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!match) {
      throw ApiError.unauthorized('Identifiants incorrects (email ou mot de passe invalide)');
    }

    // Payload JWT sécurisé
    const payload = {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role.nom,
      role_id: utilisateur.role_id,
    };

    const token = jwt.sign(payload, env.JWT.SECRET, {
      expiresIn: env.JWT.EXPIRES_IN,
    });

    const userProfile = {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
    };

    return {
      token,
      utilisateur: userProfile,
    };
  }

  /**
   * Récupère le profil de l'utilisateur authentifié
   * @param {number} userId
   */
  async getMe(userId) {
    const utilisateur = await utilisateurRepository.findById(userId);
    if (!utilisateur) {
      throw ApiError.notFound('Utilisateur non trouvé');
    }
    return utilisateur;
  }
}

module.exports = new AuthService();
