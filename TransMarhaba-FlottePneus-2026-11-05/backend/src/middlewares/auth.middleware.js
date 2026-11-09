const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Middleware d'authentification par JWT
 * Vérifie le header 'Authorization: Bearer <token>'
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Token d\'authentification manquant ou mal formaté'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT.SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Le token d\'authentification a expiré'));
    }
    return next(ApiError.unauthorized('Token d\'authentification invalide'));
  }
}

module.exports = verifyToken;
