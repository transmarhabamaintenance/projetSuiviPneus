const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const roleRoutes = require('./role.routes');
const utilisateurRoutes = require('./utilisateur.routes');
const camionRoutes = require('./camion.routes');
const pneuRoutes = require('./pneu.routes');
const historiqueRoutes = require('./historique.routes');
const dashboardRoutes = require('./dashboard.routes');

// Préfixe de toutes les routes de l'API
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/utilisateurs', utilisateurRoutes);
router.use('/camions', camionRoutes);
router.use('/pneus', pneuRoutes);
router.use('/historique', historiqueRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
