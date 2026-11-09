const express = require('express');
const router = express.Router();
const camionController = require('../controllers/camion.controller');
const pneuController = require('../controllers/pneu.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createCamionSchema,
  updateCamionSchema,
  updateCompteurSchema,
  monterPneuSchema,
  retirerPneuSchema,
  remplacerPneuSchema,
} = require('../utils/validators');

// Authentification requise pour toutes les routes camions
router.use(verifyToken);

// Consultation camions (ADMIN, GESTIONNAIRE, CHAUFFEUR)
router.get('/', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), camionController.getAll);
router.get('/:id', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), camionController.getById);

// Mise à jour du compteur après un voyage (autorisé aussi aux chauffeurs)
router.patch(
  '/:id/compteur',
  authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'),
  validate(updateCompteurSchema),
  camionController.updateCompteur
);

// CRUD Camions (ADMIN, GESTIONNAIRE)
router.post(
  '/',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(createCamionSchema),
  camionController.create
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(updateCamionSchema),
  camionController.update
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  camionController.delete
);

// Opérations pneus sur camion (ADMIN, GESTIONNAIRE)
// Monter un pneu
router.post(
  '/:id/pneus',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(monterPneuSchema),
  pneuController.monter
);

// Retirer (démonter) un pneu
router.post(
  '/:camionId/pneus/:pneuId/retirer',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(retirerPneuSchema),
  pneuController.retirer
);

// Remplacer un pneu
router.post(
  '/:camionId/pneus/:pneuId/remplacer',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(remplacerPneuSchema),
  pneuController.remplacer
);

module.exports = router;
