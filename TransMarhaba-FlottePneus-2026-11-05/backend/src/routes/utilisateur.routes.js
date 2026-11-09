const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createUtilisateurSchema, updateUtilisateurSchema } = require('../utils/validators');

// Toutes les routes utilisateurs sont réservées au rôle ADMIN
router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/', utilisateurController.getAll);
router.get('/:id', utilisateurController.getById);
router.post('/', validate(createUtilisateurSchema), utilisateurController.create);
router.put('/:id', validate(updateUtilisateurSchema), utilisateurController.update);
router.delete('/:id', utilisateurController.delete);

module.exports = router;
