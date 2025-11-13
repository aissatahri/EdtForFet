const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG template avec le design de calendrier
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  
  <!-- Calendar icon -->
  <g transform="translate(${size * 0.15}, ${size * 0.15})">
    <!-- Header bar -->
    <rect x="0" y="0" width="${size * 0.7}" height="${size * 0.12}" fill="#4c51bf" rx="${size * 0.03}"/>
    
    <!-- Calendar body -->
    <rect x="0" y="${size * 0.08}" width="${size * 0.7}" height="${size * 0.62}" fill="white" rx="${size * 0.03}"/>
    
    <!-- Rings on top -->
    <circle cx="${size * 0.175}" cy="${size * 0.04}" r="${size * 0.03}" fill="white"/>
    <circle cx="${size * 0.35}" cy="${size * 0.04}" r="${size * 0.03}" fill="white"/>
    <circle cx="${size * 0.525}" cy="${size * 0.04}" r="${size * 0.03}" fill="white"/>
    
    <!-- Grid dots (schedule representation) -->
    <circle cx="${size * 0.15}" cy="${size * 0.22}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.35}" cy="${size * 0.22}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.55}" cy="${size * 0.22}" r="${size * 0.025}" fill="#667eea"/>
    
    <circle cx="${size * 0.15}" cy="${size * 0.38}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.35}" cy="${size * 0.38}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.55}" cy="${size * 0.38}" r="${size * 0.025}" fill="#667eea"/>
    
    <circle cx="${size * 0.15}" cy="${size * 0.54}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.35}" cy="${size * 0.54}" r="${size * 0.025}" fill="#667eea"/>
    <circle cx="${size * 0.55}" cy="${size * 0.54}" r="${size * 0.025}" fill="#667eea"/>
  </g>
</svg>
`;

// Tailles d'icônes PWA requises
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Dossier de destination
const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Génération des icônes PWA avec le design calendrier...\n');

// Générer chaque taille
const promises = sizes.map(async (size) => {
  const svg = svgTemplate(size);
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ icon-${size}x${size}.png créée`);
  } catch (error) {
    console.error(`❌ Erreur pour icon-${size}x${size}.png:`, error.message);
  }
});

Promise.all(promises).then(() => {
  console.log('\n🎉 Toutes les icônes PWA ont été générées avec succès !');
  console.log(`📁 Emplacement : ${iconsDir}`);
}).catch((error) => {
  console.error('\n❌ Erreur lors de la génération:', error);
});
