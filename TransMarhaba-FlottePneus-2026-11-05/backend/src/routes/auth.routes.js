const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../utils/validators');

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
