const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const utilisateurRepository = require('../repositories/utilisateur.repository');
const roleRepository = require('../repositories/role.repository');

class UtilisateurService {
  /**
   * Liste tous les utilisateurs
   */
  async getAllUtilisateurs() {
    return utilisateurRepository.findAll();
  }

  /**
   * Détail d'un utilisateur par son ID
   * @param {number} id
   */
  async getUtilisateurById(id) {
    const utilisateur = await utilisateurRepository.findById(id);
    if (!utilisateur) {
      throw ApiError.notFound(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return utilisateur;
  }

  /**
   * Création d'un utilisateur avec hashage sécurisé du mot de passe
   */
  async createUtilisateur({ nom, prenom, email, motDePasse, role_id }) {
    // Vérification existence du rôle
    const role = await roleRepository.findById(role_id);
    if (!role) {
      throw ApiError.badRequest(`Le rôle avec l'ID ${role_id} n'existe pas`);
    }

    // Vérification email unique
    const existing = await utilisateurRepository.findByEmailWithPassword(email);
    if (existing) {
      throw ApiError.conflict(`L'adresse email ${email} est déjà utilisée`);
    }

    // Hashage bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasse, salt);

    return utilisateurRepository.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      role_id,
    });
  }

  /**
   * Modification d'un utilisateur
   */
  async updateUtilisateur(id, { nom, prenom, email, motDePasse, role_id }) {
    const utilisateur = await utilisateurRepository.findById(id);
    if (!utilisateur) {
      throw ApiError.notFound(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    if (role_id !== undefined) {
      const role = await roleRepository.findById(role_id);
      if (!role) {
        throw ApiError.badRequest(`Le rôle avec l'ID ${role_id} n'existe pas`);
      }
    }

    if (email !== undefined && email !== utilisateur.email) {
      const existing = await utilisateurRepository.findByEmailWithPassword(email);
      if (existing && existing.id !== Number(id)) {
        throw ApiError.conflict(`L'adresse email ${email} est déjà utilisée`);
      }
    }

    let hashedPassword = undefined;
    if (motDePasse && motDePasse.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(motDePasse, salt);
    }

    return utilisateurRepository.update(id, {
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      role_id,
    });
  }

  /**
   * Suppression d'un utilisateur
   */
  async deleteUtilisateur(id, currentUserId) {
    if (Number(id) === Number(currentUserId)) {
      throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
    }

    const utilisateur = await utilisateurRepository.findById(id);
    if (!utilisateur) {
      throw ApiError.notFound(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    await utilisateurRepository.delete(id);
    return { message: 'Utilisateur supprimé avec succès' };
  }
}

module.exports = new UtilisateurService();
