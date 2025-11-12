const fs = require('fs');
const path = require('path');

// Lire la variable d'environnement ENABLE_DONATION
// Par défaut FALSE, activé uniquement si explicitement défini à 'true'
const enableDonation = process.env.ENABLE_DONATION === 'true';

console.log(`🔧 Configuration: ENABLE_DONATION = ${enableDonation}`);

// Créer le fichier env-config.js avec la valeur
const envConfig = `// Configuration d'environnement générée au build
window.ENABLE_DONATION = '${enableDonation}';
`;

const envConfigPath = path.join(__dirname, 'src', 'env-config.js');
fs.writeFileSync(envConfigPath, envConfig, 'utf8');

console.log(`✅ Fichier env-config.js créé avec ENABLE_DONATION = ${enableDonation}`);
