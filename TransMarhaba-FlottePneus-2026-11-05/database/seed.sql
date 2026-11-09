-- ============================================================
-- Données initiales (Seed) : gestion_pneus_camions
-- ============================================================

USE gestion_pneus_camions;

-- 1. Rôles
INSERT INTO Role (id, nom, description) VALUES
  (1, 'ADMIN', 'Administrateur avec privilèges complets (système, utilisateurs, camions, pneus)'),
  (2, 'GESTIONNAIRE', 'Gestionnaire de flotte (CRUD camions, pneus, montages, compteurs)'),
  (3, 'CHAUFFEUR', 'Chauffeur (consultation du parc et mise à jour des compteurs après trajet)')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Utilisateurs
-- Mots de passe hashés avec bcrypt (cost 10) :
-- admin@transport.com : Admin123!
-- gestionnaire@transport.com : Gestionnaire123!
-- chauffeur@transport.com : Chauffeur123!
INSERT INTO Utilisateur (id, nom, prenom, email, motDePasse, role_id) VALUES
  (1, 'Mach', 'Nouhayla', 'admin@transport.com', '$2a$10$qjcyfCCLskV8gpse7npksuXr8YXxeOZJSZXQcXLAnjh4VCWN/QONe', 1),
  (2, 'Test', 'Gestion', 'gestionnaire@transport.com', '$2a$10$qjcyfCCLskV8gpse7npksu9P445SdX1gr2qhef9vAAdNXR9ORvYBq', 2),
  (3, 'Test', 'Chauffeur', 'chauffeur@transport.com', '$2a$10$qjcyfCCLskV8gpse7npksuDHF9Z6FVaOUGJw6BnvL38i1MAUnjD6q', 3)
ON DUPLICATE KEY UPDATE 
  nom = VALUES(nom),
  prenom = VALUES(prenom),
  motDePasse = VALUES(motDePasse),
  email = VALUES(email);

-- 3. Camions (2 camions d'exemple)
INSERT INTO Camion (id, immatriculation, marque, modele, compteurInitial, compteurActuel) VALUES
  (1, 'AA-123-AA', 'Renault Trucks', 'T-High 520', 50000, 50000),
  (2, 'BB-456-BB', 'Volvo', 'FH 500 Globetrotter', 80000, 80000)
ON DUPLICATE KEY UPDATE
  marque = VALUES(marque),
  modele = VALUES(modele);

-- 4. Pneus (6 pneus d'exemple représentatifs des différents statuts)
INSERT INTO Pneu (id, reference, marque, dureeVieMax, kilometrageCumule, statut) VALUES
  (1, 'PNEU-001', 'Michelin', 1150, 0, 'NEUF'),
  (2, 'PNEU-002', 'Michelin', 1150, 450, 'EN_SERVICE'),
  (3, 'PNEU-003', 'Goodyear', 1150, 1050, 'A_REMPLACER'),
  (4, 'PNEU-004', 'Continental', 1150, 1200, 'EXPIRE'),
  (5, 'PNEU-005', 'Bridgestone', 1150, 200, 'EN_SERVICE'),
  (6, 'PNEU-006', 'Pirelli', 1150, 0, 'NEUF')
ON DUPLICATE KEY UPDATE
  dureeVieMax = VALUES(dureeVieMax),
  kilometrageCumule = VALUES(kilometrageCumule),
  statut = VALUES(statut);

-- 5. Historique (Montages actifs sur le camion 1 pour démonstration immédiate)
INSERT INTO Historique (id, camion_id, pneu_id, position, dateInstallation, dateRetrait, compteurCamionDebut, compteurCamionFin, kmParcourus, motifRetrait) VALUES
  (1, 1, 2, 'AVG', NOW(), NULL, 50000, NULL, 0, NULL),
  (2, 1, 3, 'AVD', NOW(), NULL, 50000, NULL, 0, NULL),
  (3, 1, 5, 'ARG1', NOW(), NULL, 50000, NULL, 0, NULL)
ON DUPLICATE KEY UPDATE
  position = VALUES(position);
