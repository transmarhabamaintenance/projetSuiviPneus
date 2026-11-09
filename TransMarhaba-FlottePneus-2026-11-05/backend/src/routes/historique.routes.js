const express = require('express');
const router = express.Router();
const historiqueController = require('../controllers/historique.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

router.use(verifyToken);

// Consultation de l'historique (ADMIN, GESTIONNAIRE, CHAUFFEUR)
router.get('/', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), historiqueController.getAll);

module.exports = router;
