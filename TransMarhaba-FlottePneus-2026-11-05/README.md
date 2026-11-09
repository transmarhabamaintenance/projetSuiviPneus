# 🚛 TransMarhaba — Gestion de Flotte de Camions & Suivi Kilométrique des Pneus

Application full-stack complète conçue pour le suivi d'usure des pneumatiques de camions après chaque voyage, respectant rigoureusement une architecture en couches, les contraintes d'intégrité relationnelle MySQL et les règles métier de transport.

---

## 📋 Table des matières
1. [Fonctionnalités & Règles Métier](#-fonctionnalités--règles-métier)
2. [Stack Technique](#-stack-technique)
3. [Arborescence du Projet](#-arborescence-du-projet)
4. [Prérequis & Installation](#-prérequis--installation)
5. [Initialisation de la Base de Données](#-initialisation-de-la-base-de-données)
6. [Lancement de l'Application](#-lancement-de-lapplication)
7. [Comptes de Test](#-comptes-de-test)
8. [Documentation de l'API REST](#-documentation-de-lapi-rest)
9. [Exécution des Tests Unitaires](#-exécution-des-tests-unitaires)

---

## 🎯 Fonctionnalités & Règles Métier

- **Modèle relationnel strict (5 entités)** : `Role`, `Utilisateur`, `Camion`, `Pneu`, `Historique`.
- **Règles de calcul et statuts d'usure** :
  - `NEUF` : `kilometrageCumule = 0 km`
  - `EN_SERVICE` : pourcentage d'usure `< 90 %`
  - `A_REMPLACER` : `90 % ≤ pourcentage d'usure < 100 %`
  - `EXPIRE` : `pourcentage d'usure ≥ 100 %`
  - *Durée de vie par défaut* : `1150 km` (configurable via `DUREE_VIE_MAX_PNEU` dans `.env`).
  - *Seuil d'alerte* : `90 %` (configurable via `SEUIL_ALERTE_USURE` dans `.env`).
  - *Kilométrage restant* : `max(0, dureeVieMax - kilometrageCumule)`.
- **Mise à jour du compteur (après un voyage)** :
  - Toute valeur `nouveauCompteur >= 0` est acceptée, y compris inférieure au compteur actuel (permet de corriger une saisie erronée).
  - Calcul du `delta = nouveauCompteur - compteurActuel`, négatif dans le cas d'une correction.
  - Le `kilometrageCumule` d'un pneu et le `kmParcourus` d'un montage ne descendent jamais sous `0 km`.
  - **Transaction MySQL atomique** : mise à jour du compteur camion, cumul de distance sur chaque pneu actif (`kilometrageCumule += delta`), actualisation du statut d'usure et mise à jour de l'historique actif (`kmParcourus` et `compteurCamionFin`).
- **Gestion des montages et remplacements** :
  - Montage sécurisé : vérifie qu'un pneu n'est pas déjà monté ailleurs et que la position est vacante.
  - Retrait : clôture avec date, compteur et motif obligatoire.
  - Remplacement : démontage de l'ancien pneu et montage du nouveau dans une seule transaction MySQL.
- **Rôles et permissions (RBAC)** :
  - `ADMIN` : accès total, y compris gestion CRUD des utilisateurs.
  - `GESTIONNAIRE` : gestion du parc de camions, pneus, montages/retraits/remplacements et compteurs.
  - `CHAUFFEUR` : consultation en lecture seule + mise à jour du compteur kilométrique après voyage.

---

## 🛠 Stack Technique

- **Backend** : Node.js (v18+ ou v22), Express, architecture en couches (`routes` → `controllers` → `services` → `repositories`).
- **Base de données** : MySQL 8.0+ avec requêtes préparées (`mysql2/promise`) et transactions atomiques.
- **Sécurité** : JWT (`jsonwebtoken`), hashage sécurisé (`bcryptjs`), validation des payloads (`zod`).
- **Frontend** : React 18, Vite, React Router v6, Axios avec intercepteur Bearer et gestion d'expiration 401, icônes Lucide.
- **Tests** : Jest (tests unitaires sur les règles métier de statut et mise à jour de compteur).

---

## 📁 Arborescence du Projet

```text
projetPneuxCamion/
├── database/
│   ├── schema.sql              # Définition des 5 tables, clés étrangères et index
│   └── seed.sql                # Données initiales (rôles, admin, camions, pneus, montages)
├── backend/
│   ├── .env.example            # Gabarit des variables d'environnement backend
│   ├── .env                    # Configuration active
│   ├── package.json            # Dépendances et scripts backend
│   ├── jest.config.js          # Configuration des tests unitaires
│   ├── app.js                  # Configuration Express, CORS et middlewares d'erreur
│   ├── server.js               # Démarrage du serveur HTTP et test DB
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # Pool MySQL2 et helper withTransaction
│   │   │   ├── env.js          # Centralisation des variables d'environnement
│   │   │   └── seedRunner.js   # Script Node.js de seeding automatique avec bcrypt
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js     # Vérification JWT Bearer
│   │   │   ├── role.middleware.js     # Autorisation par rôles (ADMIN, GESTIONNAIRE, CHAUFFEUR)
│   │   │   ├── validate.middleware.js # Validation Zod des requêtes
│   │   │   └── error.middleware.js    # Gestionnaire d'erreurs uniforme { message, details }
│   │   ├── repositories/
│   │   │   ├── role.repository.js
│   │   │   ├── utilisateur.repository.js
│   │   │   ├── camion.repository.js
│   │   │   ├── pneu.repository.js
│   │   │   └── historique.repository.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── utilisateur.service.js
│   │   │   ├── camion.service.js
│   │   │   ├── pneu.service.js
│   │   │   ├── historique.service.js
│   │   │   └── dashboard.service.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── utilisateur.controller.js
│   │   │   ├── role.controller.js
│   │   │   ├── camion.controller.js
│   │   │   ├── pneu.controller.js
│   │   │   ├── historique.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── utilisateur.routes.js
│   │   │   ├── role.routes.js
│   │   │   ├── camion.routes.js
│   │   │   ├── pneu.routes.js
│   │   │   ├── historique.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── index.js
│   │   └── utils/
│   │       ├── apiError.js     # Classe d'erreur standardisée
│   │       ├── statutPneu.js   # Fonctions pures de calcul des statuts et km restants
│   │       └── validators.js   # Schémas de validation Zod
│   └── tests/
│       ├── statutPneu.test.js     # Tests des règles de seuils et d'usure
│       └── camionCompteur.test.js # Tests de la mise à jour de compteur et transactions
├── frontend/
│   ├── .env.example            # Gabarit variables d'environnement frontend
│   ├── .env                    # URL API frontend
│   ├── package.json            # Dépendances React & Vite
│   ├── vite.config.js          # Configuration Vite & proxy API
│   ├── index.html              # Point d'entrée HTML
│   └── src/
│       ├── index.css           # Thème CSS moderne et adaptatif
│       ├── main.jsx            # Montage React
│       ├── App.jsx             # Point d'entrée composant
│       ├── api/
│       │   ├── axios.js        # Instance Axios avec intercepteurs JWT & 401
│       │   ├── auth.api.js
│       │   ├── camion.api.js
│       │   ├── pneu.api.js
│       │   ├── historique.api.js
│       │   ├── utilisateur.api.js
│       │   └── dashboard.api.js
│       ├── context/
│       │   └── AuthContext.jsx # Gestion de session et persistance token
│       ├── components/
│       │   ├── Navbar.jsx          # En-tête avec navigation conditionnée au rôle
│       │   ├── ProtectedRoute.jsx  # Garde de route par authentification et rôle
│       │   ├── StatusBadge.jsx     # Badges colorés (NEUF, EN_SERVICE, A_REMPLACER, EXPIRE)
│       │   ├── ProgressBar.jsx     # Barre d'usure dynamique (vert / orange / rouge)
│       │   └── Modal.jsx           # Composant de dialogue réutilisable
│       ├── pages/
│       │   ├── LoginPage.jsx       # Connexion + boutons d'accès direct par rôle
│       │   ├── DashboardPage.jsx   # Métriques consolidées & alertes usure
│       │   ├── CamionsPage.jsx     # Liste, recherche, création et modification camions
│       │   ├── CamionDetailPage.jsx# Relevé compteur, châssis pneus, monter/retirer/remplacer
│       │   ├── PneusPage.jsx       # Inventaire pneus, filtre usure/disponibilité, création
│       │   ├── PneuDetailPage.jsx  # Fiche technique et historique chronologique
│       │   ├── HistoriquePage.jsx  # Journal filtrable des montages/démontages
│       │   ├── UtilisateursPage.jsx# Administration des utilisateurs (réservé ADMIN)
│       │   └── NotFoundPage.jsx
│       └── routes/
│           └── AppRoutes.jsx       # Définition des routes et autorisations
├── package.json                # Scripts npm globaux pour orchestrer le projet
└── README.md
```

---

## ⚙️ Prérequis & Installation

### Prérequis
- **Node.js** version 18.x ou 20.x+
- **MySQL** version 8.0+ en cours d'exécution sur votre machine (port 3306 par défaut)

### Installation des dépendances

Le projet ne fournit que les gabarits `.env.example` : créez d'abord les fichiers `.env` actifs, sans quoi le backend ne peut pas se connecter à MySQL.
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
*(Sous Windows : `copy backend\.env.example backend\.env`)*

Adaptez `DB_PASSWORD` dans `backend/.env` selon votre serveur MySQL local.

À la racine du projet, exécutez la commande suivante pour installer à la fois le backend et le frontend :
```bash
npm run install:all
```
*(Ou manuellement : `cd backend && npm install`, puis `cd ../frontend && npm install`)*

---

## 🗄 Initialisation de la Base de Données

### 1. Configuration des accès MySQL
Vérifiez ou adaptez les variables dans le fichier `backend/.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion_pneus_camions
```

### 2. Création des tables et chargement des données initiales

#### Option A : En ligne de commande MySQL / terminal
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

#### Option B : Via le script automatisé Node.js (Recommandé)
Créez la base `gestion_pneus_camions` dans MySQL si elle n'existe pas, puis lancez :
```bash
cd backend
npm run seed
```
Ce script crée les rôles, camions, pneus, affectations et hash automatiquement les mots de passe avec `bcryptjs`.

---

## 🚀 Lancement de l'Application

### 1. Démarrer le serveur Backend
Dans un premier terminal :
```bash
cd backend
npm run dev
```
Le serveur démarre sur **`http://localhost:5000`** (API accessible sur `/api`).

### 2. Démarrer le client Frontend
Dans un second terminal :
```bash
cd frontend
npm run dev
```
L'interface utilisateur s'ouvre sur **`http://localhost:5173`**.

---

## 🔑 Comptes de Test Pré-configurés

Pour faciliter vos tests et démonstrations, trois comptes représentant chaque niveau de permission sont disponibles (les trois boutons de la page de connexion ouvrent directement la session correspondante, sans saisie ni second clic) :

| Rôle             | Adresse Email                | Mot de passe       | Droits & Accès |
|------------------|------------------------------|--------------------|---|
| **ADMIN**        | `admin@transport.com`        | `Admin123!`        | Accès total : gestion utilisateurs, camions, pneus, montages, compteurs |
| **GESTIONNAIRE** | `gestionnaire@transport.com` | `Gestionnaire123!` | Gestion camions, pneus, montages/retraits/remplacements, compteurs |
| **CHAUFFEUR**    | `chauffeur@transport.com`    | `Chauffeur123!`    | Consultation du parc + saisie du relevé kilométrique après voyage |

---

## 📡 Documentation de l'API REST

Toutes les routes sont préfixées par `/api`. Les routes protégées nécessitent l'en-tête HTTP :  
`Authorization: Bearer <votre_token_jwt>`

### Format d'erreur uniforme
Toute erreur renvoie un objet JSON structuré :
```json
{
  "message": "Description de l'erreur",
  "details": ["Précision optionnelle"]
}
```

### 1. Authentification & Rôles
| Méthode   | Route             | Rôles autorisés   | Description |
|-----------|-------------------|-------------------|---|
| `POST`    | `/api/auth/login` | Public            | Authentification. Body : `{ "email": "...", "motDePasse": "..." }` |
| `GET`     | `/api/auth/me`    | Tous              | Profil de l'utilisateur connecté |
| `GET`     | `/api/roles`      | Tous              | Liste des rôles système |

### 2. Utilisateurs (Réservé ADMIN)
| Méthode   | Route                   | Description |
|-----------|-------------------------|---|
| `GET`     | `/api/utilisateurs`     | Liste tous les utilisateurs |
| `GET`     | `/api/utilisateurs/:id` | Détail d'un utilisateur |
| `POST`    | `/api/utilisateurs`     | Création. Body : `{ "nom", "prenom", "email", "motDePasse", "role_id" }` |
| `PUT`     | `/api/utilisateurs/:id` | Mise à jour des informations |
| `DELETE`  | `/api/utilisateurs/:id` | Suppression |

### 3. Camions & Compteurs
| Méthode   | Route                       | Rôles autorisés                | Description |
|-----------|-----------------------------|--------------------------------|---|
| `GET`     | `/api/camions`              | Tous                           | Liste des camions avec nombre de pneus actifs |
| `GET`     | `/api/camions/:id`          | Tous                           | Détail du camion avec tous ses pneus actifs, usure et position |
| `POST`    | `/api/camions`              | Admin, Gestionnaire            | Création (`compteurActuel` = `compteurInitial`) |
| `PUT`     | `/api/camions/:id`          | Admin, Gestionnaire            | Modification (immatriculation, marque, modèle) |
| `DELETE`  | `/api/camions/:id`          | Admin, Gestionnaire            | Suppression (refusée si pneus montés) |
| `PATCH`   | `/api/camions/:id/compteur` | **Tous (y compris Chauffeur)** | **Mise à jour du compteur**. Body : `{ "nouveauCompteur": 50150 }`. Calcule le delta, propage l'usure aux pneus et met à jour l'historique dans une transaction atomique. |

### 4. Opérations Pneumatiques sur Camion
| Méthode   | Route                                            | Rôles               | Description |
|-----------|--------------------------------------------------|---------------------|---|
| `POST`    | `/api/camions/:id/pneus`                         | Admin, Gestionnaire | **Monter** un pneu. Body : `{ "pneuId": 1, "position": "AVG" }` |
| `POST`    | `/api/camions/:camionId/pneus/:pneuId/retirer`   | Admin, Gestionnaire | **Retirer** un pneu. Body : `{ "motif": "Crevaison" }` |
| `POST`    | `/api/camions/:camionId/pneus/:pneuId/remplacer` | Admin, Gestionnaire | **Remplacer** un pneu. Body : `{ "nouveauPneuId": 6, "motif": "Usure > 90%" }` (démontage et nouveau montage dans une transaction) |

### 5. Pneus & Inventaire
| Méthode   | Route            | Rôles               | Description |
|-----------|------------------|---------------------|---|
| `GET`     | `/api/pneus`     | Tous                | Liste des pneus (filtres : `statut`, `marque`, `disponible=true`) |
| `GET`     | `/api/pneus/:id` | Tous                | Fiche technique du pneu avec historique complet de ses montages |
| `POST`    | `/api/pneus`     | Admin, Gestionnaire | Création. Body : `{ "reference", "marque", "dureeVieMax": 1150, "kilometrageCumule": 0 }` |
| `PUT`     | `/api/pneus/:id` | Admin, Gestionnaire | Modification et recalcul automatique du statut |
| `DELETE`  | `/api/pneus/:id` | Admin, Gestionnaire | Suppression (refusée si actuellement monté) |

### 6. Historique & Tableau de Bord
| Méthode   | Route             | Rôles   | Description |
|-----------|-------------------|---------|---|
| `GET`     | `/api/historique` | Tous    | Historique complet filtrable (`?camionId=1&pneuId=2&actif=true`) |
| `GET`     | `/api/dashboard`  | Tous    | Statistiques consolidées (totaux, répartition par statut, liste des alertes) |

---

## 🧪 Exécution des Tests Unitaires

Des tests unitaires Jest valident la conformité stricte des règles métier critiques :
1. **Calcul du statut d'un pneu** (`NEUF`, `EN_SERVICE`, seuil `A_REMPLACER` à 90 %, `EXPIRE` à 100 %).
2. **Calcul de la vie restante** (`max(0, dureeVieMax - kilometrageCumule)`).
3. **Mise à jour du compteur d'un camion** (accepte toute valeur ≥ 0 y compris une correction inférieure au compteur actuel, calcul du delta signé, propagation aux pneus actifs avec plafond à 0 km et mise à jour de l'historique dans une transaction).

Pour lancer les tests Jest :
```bash
cd backend
npm test
```
Résultat attendu :
```text
PASS tests/camionCompteur.test.js
PASS tests/statutPneu.test.js
Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```
