const express = require('express');
const router = express.Router();
const pneuController = require('../controllers/pneu.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createPneuSchema, updatePneuSchema } = require('../utils/validators');

router.use(verifyToken);

// Consultation (ADMIN, GESTIONNAIRE, CHAUFFEUR)
router.get('/', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), pneuController.getAll);
router.get('/:id', authorizeRoles('ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR'), pneuController.getById);

// Gestion CRUD Pneus (ADMIN, GESTIONNAIRE)
router.post(
  '/',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(createPneuSchema),
  pneuController.create
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  validate(updatePneuSchema),
  pneuController.update
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'GESTIONNAIRE'),
  pneuController.delete
);

module.exports = router;
