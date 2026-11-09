const dotenv = require('dotenv');
const path = require('path');

// Chargement des variables d'environnement depuis .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'gestion_pneus_camions',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'cle_secrete_jwt_par_defaut_super_securisee',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  },
  RULES: {
    // Valeur de durée de vie par défaut (1150 km si non définie)
    DUREE_VIE_MAX_PNEU: parseInt(process.env.DUREE_VIE_MAX_PNEU, 10) || 1150,
    // Seuil d'alerte pour statut A_REMPLACER (ex: 0.90 pour 90%)
    SEUIL_ALERTE_USURE: parseFloat(process.env.SEUIL_ALERTE_USURE) || 0.90,
  },
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = env;
