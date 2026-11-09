const ApiError = require('../utils/apiError');

/**
 * Middleware d'ordre supérieur pour valider les requêtes via un schéma Zod
 * @param {import('zod').ZodSchema} schema - Schéma Zod pour valider body / query / params
 * @param {'body' | 'query' | 'params'} [source='body'] - Source de données à valider
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // assigner les données validées et nettoyées
      next();
    } catch (error) {
      if (error.errors) {
        const details = error.errors.map((e) => ({
          champ: e.path.join('.'),
          message: e.message,
        }));
        return next(new ApiError(400, 'Données de requête invalides', details));
      }
      return next(error);
    }
  };
}

module.exports = validate;
