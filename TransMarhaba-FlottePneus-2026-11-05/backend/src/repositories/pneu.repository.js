const { pool } = require('../config/db');

class PneuRepository {
  /**
   * Récupère tous les pneus avec information sur leur montage éventuel
   */
  async findAll(filtres = {}) {
    let sql = `
      SELECT 
        p.*,
        h.id AS montage_actif_id,
        h.position AS position_actuelle,
        h.camion_id AS camion_actuel_id,
        c.immatriculation AS camion_immatriculation
      FROM Pneu p
      LEFT JOIN Historique h ON h.pneu_id = p.id AND h.dateRetrait IS NULL
      LEFT JOIN Camion c ON c.id = h.camion_id
      WHERE 1=1
    `;
    const params = [];

    if (filtres.statut) {
      sql += ' AND p.statut = ?';
      params.push(filtres.statut);
    }
    if (filtres.marque) {
      sql += ' AND p.marque LIKE ?';
      params.push(`%${filtres.marque}%`);
    }
    if (filtres.disponible === 'true' || filtres.disponible === true) {
      // Pneus libres non montés sur un camion
      sql += ' AND h.id IS NULL';
    }

    sql += ' ORDER BY p.id ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Trouve un pneu par son ID
   */
  async findById(id, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT 
        p.*,
        h.id AS montage_actif_id,
        h.position AS position_actuelle,
        h.camion_id AS camion_actuel_id,
        c.immatriculation AS camion_immatriculation
      FROM Pneu p
      LEFT JOIN Historique h ON h.pneu_id = p.id AND h.dateRetrait IS NULL
      LEFT JOIN Camion c ON c.id = h.camion_id
      WHERE p.id = ?
    `, [id]);

    return rows[0] || null;
  }

  /**
   * Trouve un pneu par sa référence unique
   */
  async findByReference(reference) {
    const [rows] = await pool.query('SELECT * FROM Pneu WHERE reference = ?', [reference]);
    return rows[0] || null;
  }

  /**
   * Crée un nouveau pneu
   */
  async create({ reference, marque, dureeVieMax, kilometrageCumule, statut }, conn = null) {
    const executor = conn || pool;
    const [result] = await executor.execute(`
      INSERT INTO Pneu (reference, marque, dureeVieMax, kilometrageCumule, statut)
      VALUES (?, ?, ?, ?, ?)
    `, [reference, marque, dureeVieMax, kilometrageCumule, statut]);

    return this.findById(result.insertId, conn);
  }

  /**
   * Met à jour les informations d'un pneu
   */
  async update(id, { reference, marque, dureeVieMax, kilometrageCumule, statut }, conn = null) {
    const executor = conn || pool;
    const fields = [];
    const values = [];

    if (reference !== undefined) {
      fields.push('reference = ?');
      values.push(reference);
    }
    if (marque !== undefined) {
      fields.push('marque = ?');
      values.push(marque);
    }
    if (dureeVieMax !== undefined) {
      fields.push('dureeVieMax = ?');
      values.push(dureeVieMax);
    }
    if (kilometrageCumule !== undefined) {
      fields.push('kilometrageCumule = ?');
      values.push(kilometrageCumule);
    }
    if (statut !== undefined) {
      fields.push('statut = ?');
      values.push(statut);
    }

    if (fields.length === 0) {
      return this.findById(id, conn);
    }

    values.push(id);
    await executor.execute(`
      UPDATE Pneu
      SET ${fields.join(', ')}
      WHERE id = ?
    `, values);

    return this.findById(id, conn);
  }

  /**
   * Met à jour le kilométrage cumulé et le statut d'un pneu (utilisé lors du voyage ou usure)
   */
  async updateKilometrageEtStatut(id, kilometrageCumule, statut, conn = null) {
    const executor = conn || pool;
    await executor.execute(`
      UPDATE Pneu
      SET kilometrageCumule = ?, statut = ?
      WHERE id = ?
    `, [kilometrageCumule, statut, id]);
  }

  /**
   * Supprime un pneu
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM Pneu WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Vérifie si un pneu a un montage actif (non retiré)
   */
  async findMontageActif(pneuId, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT h.*, c.immatriculation AS camion_immatriculation
      FROM Historique h
      INNER JOIN Camion c ON c.id = h.camion_id
      WHERE h.pneu_id = ? AND h.dateRetrait IS NULL
      LIMIT 1
    `, [pneuId]);

    return rows[0] || null;
  }

  /**
   * Statistiques : compte des pneus regroupés par statut
   */
  async countByStatut() {
    const [rows] = await pool.query(`
      SELECT statut, COUNT(*) AS total
      FROM Pneu
      GROUP BY statut
    `);

    const result = {
      NEUF: 0,
      EN_SERVICE: 0,
      A_REMPLACER: 0,
      EXPIRE: 0,
    };

    rows.forEach((row) => {
      if (result[row.statut] !== undefined) {
        result[row.statut] = Number(row.total);
      }
    });

    return result;
  }

  /**
   * Liste des pneus nécessitant une action (A_REMPLACER ou EXPIRE)
   */
  async findAlertes() {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        h.id AS montage_actif_id,
        h.position AS position_actuelle,
        h.camion_id AS camion_actuel_id,
        c.immatriculation AS camion_immatriculation
      FROM Pneu p
      LEFT JOIN Historique h ON h.pneu_id = p.id AND h.dateRetrait IS NULL
      LEFT JOIN Camion c ON c.id = h.camion_id
      WHERE p.statut IN ('A_REMPLACER', 'EXPIRE')
      ORDER BY p.statut DESC, p.kilometrageCumule DESC
    `);
    return rows;
  }
}

module.exports = new PneuRepository();
