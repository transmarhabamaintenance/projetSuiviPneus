const mysql = require('mysql2/promise');
const env = require('./env');

// Création du pool de connexions MySQL
const pool = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: 'Z',
});

/**
 * Exécute une fonction dans une transaction MySQL isolée.
 * Assure le COMMIT si succès, ou ROLLBACK si erreur, avec libération garantie de la connexion.
 *
 * @template T
 * @param {function(mysql.PoolConnection): Promise<T>} callback
 * @returns {Promise<T>}
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Erreur lors du rollback transactionnel:', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test de connectivité à la base de données
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[BDD] Connexion réussie à MySQL (${env.DB.HOST}:${env.DB.PORT}/${env.DB.NAME})`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[BDD] Erreur de connexion à MySQL :', error.message);
    return false;
  }
}

module.exports = {
  pool,
  withTransaction,
  testConnection,
};
