const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function seedDatabase() {
  console.log('--- Initialisation et seeding de la base de données ---');

  // Génération des mots de passe hashés avec bcrypt (10 rounds)
  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('Admin123!', salt);
  const hashGestionnaire = await bcrypt.hash('Gestionnaire123!', salt);
  const hashChauffeur = await bcrypt.hash('Chauffeur123!', salt);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Rôles
    await connection.execute(`
      INSERT INTO Role (id, nom, description) VALUES
        (1, 'ADMIN', 'Administrateur avec privilèges complets (système, utilisateurs, camions, pneus)'),
        (2, 'GESTIONNAIRE', 'Gestionnaire de flotte (CRUD camions, pneus, montages, compteurs)'),
        (3, 'CHAUFFEUR', 'Chauffeur (consultation du parc et mise à jour des compteurs après trajet)')
      ON DUPLICATE KEY UPDATE description = VALUES(description);
    `);

    // 2. Utilisateurs
    await connection.execute(`
      INSERT INTO Utilisateur (id, nom, prenom, email, motDePasse, role_id) VALUES
        (1, 'Mach', 'Nouhayla', 'admin@transport.com', ?, 1),
        (2, 'Test', 'Gestion', 'gestionnaire@transport.com', ?, 2),
        (3, 'Test', 'Chauffeur', 'chauffeur@transport.com', ?, 3)
      ON DUPLICATE KEY UPDATE 
        nom = VALUES(nom),
        prenom = VALUES(prenom),
        motDePasse = VALUES(motDePasse),
        role_id = VALUES(role_id);
    `, [hashAdmin, hashGestionnaire, hashChauffeur]);

    // 3. Camions (Règle métier : compteurActuel = compteurInitial à la création)
    await connection.execute(`
      INSERT INTO Camion (id, immatriculation, marque, modele, compteurInitial, compteurActuel) VALUES
        (1, 'AA-123-AA', 'Renault Trucks', 'T-High 520', 50000, 50000),
        (2, 'BB-456-BB', 'Volvo', 'FH 500 Globetrotter', 80000, 80000)
      ON DUPLICATE KEY UPDATE
        marque = VALUES(marque),
        modele = VALUES(modele);
    `);

    // 4. Pneus (avec différents statuts d'usure calculés : NEUF, EN_SERVICE, A_REMPLACER, EXPIRE)
    await connection.execute(`
      INSERT INTO Pneu (id, reference, marque, dureeVieMax, kilometrageCumule, statut) VALUES
        (1, 'PNEU-001', 'Michelin', 1150, 0, 'NEUF'),
        (2, 'PNEU-002', 'Michelin', 1150, 450, 'EN_SERVICE'),
        (3, 'PNEU-003', 'Goodyear', 1150, 1050, 'A_REMPLACER'),
        (4, 'PNEU-004', 'Continental', 1150, 1200, 'EXPIRE'),
        (5, 'PNEU-005', 'Bridgestone', 1150, 200, 'EN_SERVICE'),
        (6, 'PNEU-006', 'Pirelli', 1150, 0, 'NEUF')
      ON DUPLICATE KEY UPDATE
        marque = VALUES(marque),
        dureeVieMax = VALUES(dureeVieMax),
        kilometrageCumule = VALUES(kilometrageCumule),
        statut = VALUES(statut);
    `);

    // 5. Historique : Montages actifs initiaux sur le camion 1
    // Position AVG : Pneu 2 (EN_SERVICE)
    // Position AVD : Pneu 3 (A_REMPLACER)
    // Position ARG1 : Pneu 5 (EN_SERVICE)
    await connection.execute(`
      INSERT INTO Historique (id, camion_id, pneu_id, position, dateInstallation, dateRetrait, compteurCamionDebut, compteurCamionFin, kmParcourus, motifRetrait) VALUES
        (1, 1, 2, 'AVG', NOW(), NULL, 50000, NULL, 0, NULL),
        (2, 1, 3, 'AVD', NOW(), NULL, 50000, NULL, 0, NULL),
        (3, 1, 5, 'ARG1', NOW(), NULL, 50000, NULL, 0, NULL)
      ON DUPLICATE KEY UPDATE
        position = VALUES(position);
    `);

    await connection.commit();
    console.log('[SEED] Base de données initialisée avec succès !');
    console.log('[SEED] Comptes de test :');
    console.log('  - ADMIN: admin@transport.com / Admin123!');
    console.log('  - GESTIONNAIRE: gestionnaire@transport.com / Gestionnaire123!');
    console.log('  - CHAUFFEUR: chauffeur@transport.com / Chauffeur123!');
  } catch (err) {
    await connection.rollback();
    console.error('[SEED] Erreur pendant l\'injection des données :', err);
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
