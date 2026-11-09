-- ============================================================
-- Base de données : gestion_pneus_camions
-- Schéma relationnel strict (5 entités)
-- ============================================================

CREATE DATABASE IF NOT EXISTS gestion_pneus_camions
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestion_pneus_camions;

-- 1. Table Role
CREATE TABLE IF NOT EXISTS Role (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table Utilisateur
CREATE TABLE IF NOT EXISTS Utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  motDePasse VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_utilisateur_role FOREIGN KEY (role_id) REFERENCES Role(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table Camion
CREATE TABLE IF NOT EXISTS Camion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  immatriculation VARCHAR(50) NOT NULL UNIQUE,
  marque VARCHAR(100) NOT NULL,
  modele VARCHAR(100) NOT NULL,
  compteurInitial INT NOT NULL,
  compteurActuel INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table Pneu
CREATE TABLE IF NOT EXISTS Pneu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  marque VARCHAR(100) NOT NULL,
  dureeVieMax INT NOT NULL DEFAULT 1150,
  kilometrageCumule INT NOT NULL DEFAULT 0,
  statut ENUM('NEUF', 'EN_SERVICE', 'A_REMPLACER', 'EXPIRE') NOT NULL DEFAULT 'NEUF',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table Historique
CREATE TABLE IF NOT EXISTS Historique (
  id INT AUTO_INCREMENT PRIMARY KEY,
  camion_id INT NOT NULL,
  pneu_id INT NOT NULL,
  position VARCHAR(50) NOT NULL,
  dateInstallation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateRetrait DATETIME NULL,
  compteurCamionDebut INT NOT NULL,
  compteurCamionFin INT NULL,
  kmParcourus INT NOT NULL DEFAULT 0,
  motifRetrait VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_historique_camion FOREIGN KEY (camion_id) REFERENCES Camion(id) ON DELETE CASCADE,
  CONSTRAINT fk_historique_pneu FOREIGN KEY (pneu_id) REFERENCES Pneu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour optimiser les recherches fréquentes et le suivi des montages actifs
CREATE INDEX idx_historique_camion_actif ON Historique (camion_id, dateRetrait);
CREATE INDEX idx_historique_pneu_actif ON Historique (pneu_id, dateRetrait);
CREATE INDEX idx_historique_position_active ON Historique (camion_id, position, dateRetrait);
