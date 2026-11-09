const { pool } = require('../config/db');

class HistoriqueRepository {
  /**
   * Récupère l'historique complet avec filtres optionnels
   * @param {{ camionId?: number, pneuId?: number, actif?: boolean }} filtres
   */
  async findAll(filtres = {}) {
    let sql = `
      SELECT 
        h.*,
        c.immatriculation AS camion_immatriculation,
        c.marque AS camion_marque,
        c.modele AS camion_modele,
        p.reference AS pneu_reference,
        p.marque AS pneu_marque,
        p.statut AS pneu_statut,
        p.dureeVieMax AS pneu_dureeVieMax,
        p.kilometrageCumule AS pneu_kilometrageCumule
      FROM Historique h
      INNER JOIN Camion c ON h.camion_id = c.id
      INNER JOIN Pneu p ON h.pneu_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filtres.camionId) {
      sql += ' AND h.camion_id = ?';
      params.push(filtres.camionId);
    }
    if (filtres.pneuId) {
      sql += ' AND h.pneu_id = ?';
      params.push(filtres.pneuId);
    }
    if (filtres.actif === true || filtres.actif === 'true') {
      sql += ' AND h.dateRetrait IS NULL';
    } else if (filtres.actif === false || filtres.actif === 'false') {
      sql += ' AND h.dateRetrait IS NOT NULL';
    }

    sql += ' ORDER BY h.dateInstallation DESC, h.id DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Trouve une entrée d'historique par son ID
   */
  async findById(id, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT 
        h.*,
        c.immatriculation AS camion_immatriculation,
        p.reference AS pneu_reference
      FROM Historique h
      INNER JOIN Camion c ON h.camion_id = c.id
      INNER JOIN Pneu p ON h.pneu_id = p.id
      WHERE h.id = ?
    `, [id]);

    return rows[0] || null;
  }

  /**
   * Trouve le montage actif d'un pneu
   */
  async findActifByPneu(pneuId, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT * FROM Historique
      WHERE pneu_id = ? AND dateRetrait IS NULL
      LIMIT 1
    `, [pneuId]);

    return rows[0] || null;
  }

  /**
   * Trouve le montage actif sur une position d'un camion
   */
  async findActifByCamionEtPosition(camionId, position, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT * FROM Historique
      WHERE camion_id = ? AND position = ? AND dateRetrait IS NULL
      LIMIT 1
    `, [camionId, position]);

    return rows[0] || null;
  }

  /**
   * Trouve tous les montages actifs pour un camion
   */
  async findActifsByCamion(camionId, conn = null) {
    const executor = conn || pool;
    const [rows] = await executor.query(`
      SELECT h.*, p.reference, p.marque, p.dureeVieMax, p.kilometrageCumule, p.statut
      FROM Historique h
      INNER JOIN Pneu p ON h.pneu_id = p.id
      WHERE h.camion_id = ? AND h.dateRetrait IS NULL
      ORDER BY h.position ASC
    `, [camionId]);

    return rows;
  }

  /**
   * Crée un nouveau montage de pneu (dateRetrait = NULL)
   */
  async creerMontage({ camion_id, pneu_id, position, compteurCamionDebut }, conn = null) {
    const executor = conn || pool;
    const [result] = await executor.execute(`
      INSERT INTO Historique (
        camion_id, pneu_id, position, dateInstallation, dateRetrait,
        compteurCamionDebut, compteurCamionFin, kmParcourus, motifRetrait
      )
      VALUES (?, ?, ?, NOW(), NULL, ?, NULL, 0, NULL)
    `, [camion_id, pneu_id, position, compteurCamionDebut]);

    return this.findById(result.insertId, conn);
  }

  /**
   * Clôture un montage actif (démontage)
   */
  async cloturerMontage(id, { compteurCamionFin, kmParcourus, motifRetrait }, conn = null) {
    const executor = conn || pool;
    await executor.execute(`
      UPDATE Historique
      SET dateRetrait = NOW(),
          compteurCamionFin = ?,
          kmParcourus = ?,
          motifRetrait = ?
      WHERE id = ?
    `, [compteurCamionFin, kmParcourus, motifRetrait, id]);

    return this.findById(id, conn);
  }

  /**
   * Met à jour le compteurFin et le kmParcourus d'un montage actif lors d'un voyage
   */
  async mettreAJourKmMontage(id, { compteurCamionFin, kmParcourus }, conn = null) {
    const executor = conn || pool;
    await executor.execute(`
      UPDATE Historique
      SET compteurCamionFin = ?,
          kmParcourus = ?
      WHERE id = ?
    `, [compteurCamionFin, kmParcourus, id]);
  }

  /**
   * Historique complet pour un pneu spécifique
   */
  async findByPneu(pneuId) {
    const [rows] = await pool.query(`
      SELECT 
        h.*,
        c.immatriculation AS camion_immatriculation,
        c.marque AS camion_marque,
        c.modele AS camion_modele
      FROM Historique h
      INNER JOIN Camion c ON h.camion_id = c.id
      WHERE h.pneu_id = ?
      ORDER BY h.dateInstallation DESC, h.id DESC
    `, [pneuId]);

    return rows;
  }
}

module.exports = new HistoriqueRepository();
