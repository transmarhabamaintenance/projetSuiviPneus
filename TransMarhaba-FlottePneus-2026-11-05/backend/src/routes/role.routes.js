const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const verifyToken = require('../middlewares/auth.middleware');

// GET /api/roles
router.get('/', verifyToken, roleController.getAll);

module.exports = router;
