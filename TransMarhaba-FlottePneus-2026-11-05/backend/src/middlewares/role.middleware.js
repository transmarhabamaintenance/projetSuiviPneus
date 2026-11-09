const ApiError = require('../utils/apiError');

/**
 * Middleware d'autorisation basé sur les rôles
 * @param  {...string} allowedRoles - Liste des rôles autorisés (ex: 'ADMIN', 'GESTIONNAIRE', 'CHAUFFEUR')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Utilisateur non identifié'));
    }

    const userRole = req.user.role; // attendu sous forme de string (ex: 'ADMIN') ou objet avec .nom

    const roleName = typeof userRole === 'string' ? userRole : userRole?.nom;

    if (!roleName || !allowedRoles.includes(roleName)) {
      return next(
        ApiError.forbidden(
          `Accès refusé. Cette action nécessite l'un des rôles suivants : ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}

module.exports = authorizeRoles;
