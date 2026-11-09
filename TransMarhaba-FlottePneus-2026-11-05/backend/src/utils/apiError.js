/**
 * Classe standard pour les erreurs de l'API
 */
class ApiError extends Error {
  constructor(statusCode, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.details = Array.isArray(details) ? details : [details];
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Accès non autorisé', details = []) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Accès interdit pour vos privilèges', details = []) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Ressource non trouvée', details = []) {
    return new ApiError(404, message, details);
  }

  static conflict(message, details = []) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Erreur interne du serveur', details = []) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;
