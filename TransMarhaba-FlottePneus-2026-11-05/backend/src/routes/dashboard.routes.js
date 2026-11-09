const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

router.use(verifyToken);

// Données consolidées pour le tableau de bord
router.get('/', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), dashboardController.getDashboard);

module.exports = router;
