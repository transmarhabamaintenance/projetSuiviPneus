const express = require('express');
const cors = require('cors');
const env = require('./src/config/env');
const apiRoutes = require('./src/routes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');

const app = express();

// Middlewares de sécurité et de parsing
app.use(
  cors({
    origin: true, // Accepte dynamiquement l'origine locale (ex: 5173, 5174, etc.)
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de vérification de santé
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Montage de toutes les routes de l'API sous /api
app.use('/api', apiRoutes);

// Gestionnaire 404 pour routes inconnues
app.use(notFoundHandler);

// Gestionnaire global d'erreurs uniforme : { message: "...", details: [...] }
app.use(errorHandler);

module.exports = app;
