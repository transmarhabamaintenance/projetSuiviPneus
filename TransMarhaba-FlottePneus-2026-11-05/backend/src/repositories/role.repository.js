const { pool } = require('../config/db');

class RoleRepository {
  /**
   * Récupère tous les rôles
   */
  async findAll() {
    const [rows] = await pool.query('SELECT id, nom, description FROM Role ORDER BY id ASC');
    return rows;
  }

  /**
   * Trouve un rôle par son ID
   * @param {number} id
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT id, nom, description FROM Role WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Trouve un rôle par son nom (ex: 'ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR')
   * @param {string} nom
   */
  async findByNom(nom) {
    const [rows] = await pool.query('SELECT id, nom, description FROM Role WHERE nom = ?', [nom]);
    return rows[0] || null;
  }
}

module.exports = new RoleRepository();
