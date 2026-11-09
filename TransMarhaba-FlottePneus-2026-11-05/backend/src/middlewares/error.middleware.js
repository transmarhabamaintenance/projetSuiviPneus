const ApiError = require('../utils/apiError');

/**
 * Middleware global de gestion des erreurs Express
 * Garantit une structure de réponse uniforme : { message: string, details: array }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Erreur métier / applicative connue (ApiError)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  // Erreur de validation Zod capturée
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      message: 'Erreur de validation des données fournies',
      details,
    });
  }

  // Erreur de violation de clé unique MySQL (ex: immatriculation, email, reference déjà existante)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Un enregistrement avec cette valeur unique existe déjà dans la base.',
      details: [err.sqlMessage || err.message],
    });
  }

  // Erreur de violation de clé étrangère MySQL
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      message: 'Référence invalide vers une entité parente inexistante.',
      details: [err.sqlMessage || err.message],
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      message: 'Impossible de supprimer cette entité car elle est référencée par d\'autres enregistrements.',
      details: [err.sqlMessage || err.message],
    });
  }

  // Erreur de parsing JSON dans le corps de la requête
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Format JSON du corps de la requête invalide.',
      details: [err.message],
    });
  }

  // Erreur non gérée / interne
  console.error('[ERREUR SERVEUR INATTENDUE]', err);

  return res.status(500).json({
    message: 'Une erreur interne inattendue est survenue.',
    details: process.env.NODE_ENV === 'development' ? [err.message] : [],
  });
}

/**
 * Middleware pour les routes non trouvées (404)
 */
function notFoundHandler(req, res, next) {
  return res.status(404).json({
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    details: [],
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
