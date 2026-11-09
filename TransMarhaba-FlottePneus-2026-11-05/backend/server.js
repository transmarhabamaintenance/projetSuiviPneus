const app = require('./app');
const env = require('./src/config/env');
const { testConnection } = require('./src/config/db');

const PORT = env.PORT || 5000;

async function startServer() {
  console.log(`[BOOT] Démarrage du serveur Flotte Pneus Camion en mode ${env.NODE_ENV}...`);
  
  // Test de connectivité base de données
  await testConnection();

  app.listen(PORT, () => {
    console.log(`[SERVEUR] Serveur démarré avec succès sur le port ${PORT}`);
    console.log(`[SERVEUR] Point d'entrée API : http://localhost:${PORT}/api`);
    console.log(`[SERVEUR] Durée de vie pneu par défaut : ${env.RULES.DUREE_VIE_MAX_PNEU} km`);
    console.log(`[SERVEUR] Seuil alerte remplacement : ${env.RULES.SEUIL_ALERTE_USURE * 100} %`);
  });
}

startServer().catch((err) => {
  console.error('[BOOT] Erreur fatale au lancement du serveur :', err);
  process.exit(1);
});
