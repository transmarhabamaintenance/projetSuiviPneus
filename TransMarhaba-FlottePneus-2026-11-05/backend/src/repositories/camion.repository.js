const { pool } = require('../config/db');

class CamionRepository {
  /**
   * Récupère tous les camions avec le nombre de pneus actuellement montés
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT c.*,
             COUNT(h.id) AS nbPneusActifs
      FROM Camion c
      LEFT JOIN Historique h ON h.camion_id = c.id AND h.dateRetrait IS NULL
      GROUP BY c.id
      ORDER BY c.id ASC
    `);
    return rows;
  }

  /**
   * Trouve un camion par son ID
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   */
  async findById(id, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query('SELECT * FROM Camion WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Trouve un camion par son immatriculation
   * @param {string} immatriculation
   */
  async findByImmatriculation(immatriculation) {
    const [rows] = await pool.query('SELECT * FROM Camion WHERE immatriculation = ?', [immatriculation]);
    return rows[0] || null;
  }

  /**
   * Crée un camion
   * Règle métier : à la création, compteurActuel = compteurInitial
   */
  async create({ immatriculation, marque, modele, compteurInitial, compteurActuel }, conn = null) {
    const executor = conn || pool;
    const [result] = await executor.execute(`
      INSERT INTO Camion (immatriculation, marque, modele, compteurInitial, compteurActuel)
      VALUES (?, ?, ?, ?, ?)
    `, [immatriculation, marque, modele, compteurInitial, compteurActuel]);

    return this.findById(result.insertId, conn);
  }

  /**
   * Met à jour les informations générales d'un camion
   */
  async update(id, { immatriculation, marque, modele }, conn = null) {
    const executor = conn || pool;
    await executor.execute(`
      UPDATE Camion
      SET immatriculation = ?, marque = ?, modele = ?
      WHERE id = ?
    `, [immatriculation, marque, modele, id]);

    return this.findById(id, conn);
  }

  /**
   * Met à jour le compteur actuel d'un camion (dans le cadre d'une transaction de voyage)
   */
  async updateCompteur(id, nouveauCompteur, conn = null) {
    const executor = conn || pool;
    await executor.execute(`
      UPDATE Camion
      SET compteurActuel = ?
      WHERE id = ?
    `, [nouveauCompteur, id]);

    return this.findById(id, conn);
  }

  /**
   * Supprime un camion
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM Camion WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Récupère tous les pneus actuellement montés sur un camion donné (avec détails pneu et historique de montage)
   * @param {number} camionId
   * @param {import('mysql2/promise').PoolConnection} [conn]
   */
  async findPneusActifs(camionId, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT 
        h.id AS historique_id,
        h.position,
        h.dateInstallation,
        h.compteurCamionDebut,
        h.compteurCamionFin,
        h.kmParcourus,
        p.id AS pneu_id,
        p.reference,
        p.marque,
        p.dureeVieMax,
        p.kilometrageCumule,
        p.statut
      FROM Historique h
      INNER JOIN Pneu p ON h.pneu_id = p.id
      WHERE h.camion_id = ? AND h.dateRetrait IS NULL
      ORDER BY h.position ASC
    `, [camionId]);

    return rows;
  }

  /**
   * Vérifie si une position donnée sur un camion est déjà occupée par un pneu actif
   */
  async findPositionOccupee(camionId, position, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT * FROM Historique
      WHERE camion_id = ? AND position = ? AND dateRetrait IS NULL
      LIMIT 1
    `, [camionId, position]);

    return rows[0] || null;
  }
}

module.exports = new CamionRepository();
