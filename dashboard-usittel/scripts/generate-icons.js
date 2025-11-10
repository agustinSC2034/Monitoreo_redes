const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  // Intentar primero con .ico, si no existe usar .png
  const faviconIco = path.join(__dirname, '../public/favicon.ico');
  const faviconPng = path.join(__dirname, '../public/favicon.png');
  
  let faviconPath;
  if (fs.existsSync(faviconIco)) {
    faviconPath = faviconIco;
    console.log('📦 Usando favicon.ico');
  } else if (fs.existsSync(faviconPng)) {
    faviconPath = faviconPng;
    console.log('📦 Usando favicon.png');
  } else {
    console.error('❌ No se encontró favicon.ico ni favicon.png');
    return;
  }
  
  // Generar icon-192.png desde el favicon
  await sharp(faviconPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(__dirname, '../public/icon-192.png'));
  
  // Generar icon-512.png desde el favicon
  await sharp(faviconPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(__dirname, '../public/icon-512.png'));
  
  console.log('✅ Íconos PWA generados correctamente');
}

generateIcons().catch(console.error);
