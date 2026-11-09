const { pool } = require('../config/db');

class UtilisateurRepository {
  /**
   * Récupère tous les utilisateurs avec leur rôle
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.role_id, u.createdAt, u.updatedAt,
             r.nom AS role_nom, r.description AS role_description
      FROM Utilisateur u
      INNER JOIN Role r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    return rows.map((row) => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      role_id: row.role_id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: {
        id: row.role_id,
        nom: row.role_nom,
        description: row.role_description,
      },
    }));
  }

  /**
   * Trouve un utilisateur par son ID (sans mot de passe)
   * @param {number} id
   */
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.role_id, u.createdAt, u.updatedAt,
             r.nom AS role_nom, r.description AS role_description
      FROM Utilisateur u
      INNER JOIN Role r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      role_id: row.role_id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: {
        id: row.role_id,
        nom: row.role_nom,
        description: row.role_description,
      },
    };
  }

  /**
   * Trouve un utilisateur par son email (avec mot de passe pour vérification auth)
   * @param {string} email
   */
  async findByEmailWithPassword(email) {
    const [rows] = await pool.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.motDePasse, u.role_id,
             r.nom AS role_nom, r.description AS role_description
      FROM Utilisateur u
      INNER JOIN Role r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email]);

    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      motDePasse: row.motDePasse,
      role_id: row.role_id,
      role: {
        id: row.role_id,
        nom: row.role_nom,
        description: row.role_description,
      },
    };
  }

  /**
   * Crée un nouvel utilisateur
   * @param {{ nom: string, prenom: string, email: string, motDePasse: string, role_id: number }} data
   */
  async create({ nom, prenom, email, motDePasse, role_id }) {
    const [result] = await pool.execute(`
      INSERT INTO Utilisateur (nom, prenom, email, motDePasse, role_id)
      VALUES (?, ?, ?, ?, ?)
    `, [nom, prenom, email, motDePasse, role_id]);

    return this.findById(result.insertId);
  }

  /**
   * Met à jour un utilisateur
   * @param {number} id
   * @param {{ nom?: string, prenom?: string, email?: string, motDePasse?: string, role_id?: number }} data
   */
  async update(id, { nom, prenom, email, motDePasse, role_id }) {
    const fields = [];
    const values = [];

    if (nom !== undefined) {
      fields.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined) {
      fields.push('prenom = ?');
      values.push(prenom);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }
    if (motDePasse !== undefined && motDePasse !== null && motDePasse !== '') {
      fields.push('motDePasse = ?');
      values.push(motDePasse);
    }
    if (role_id !== undefined) {
      fields.push('role_id = ?');
      values.push(role_id);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(`
      UPDATE Utilisateur
      SET ${fields.join(', ')}
      WHERE id = ?
    `, values);

    return this.findById(id);
  }

  /**
   * Supprime un utilisateur par son ID
   * @param {number} id
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM Utilisateur WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new UtilisateurRepository();
