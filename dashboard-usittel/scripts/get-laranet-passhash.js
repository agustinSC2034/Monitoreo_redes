/**
 * 🔑 Obtener Passhash desde PRTG LARANET
 * 
 * PRTG genera un passhash único por usuario que se puede obtener
 * desde la interfaz web en: Mi Cuenta > Información de mi cuenta
 */

const https = require('https');
const http = require('http');

const baseUrl = 'http://stats.reditel.com.ar:8995';
const username = 'nocittel';
const password = '1ttel20203T#';

async function getPasshash() {
  console.log('🔑 Obteniendo passhash desde PRTG LARANET...\n');
  
  // En PRTG, el passhash se obtiene desde /api/getpasshash.htm?username=X&password=Y
  const url = `${baseUrl}/api/getpasshash.htm?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  
  console.log('📡 Consultando:', url.replace(password, '***'));
  console.log('');
  
  return new Promise((resolve, reject) => {
    const request = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Respuesta HTTP: ${res.statusCode} ${res.statusMessage}`);
        console.log('📦 Contenido:', data);
        console.log('');
        
        if (res.statusCode === 200) {
          const passhash = data.trim();
          console.log('✅ Passhash obtenido:', passhash);
          console.log('');
          console.log('📋 Actualiza tu .env.local con:');
          console.log(`PRTG_LARANET_PASSHASH=${passhash}`);
          console.log('');
          console.log('📋 Y también actualiza en Vercel y GitHub Actions');
          resolve(passhash);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

getPasshash()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Alternativa: Obtener el passhash manualmente');
    console.log('   1. Ingresa a http://stats.reditel.com.ar:8995');
    console.log('   2. Login con nocittel / 1ttel20203T#');
    console.log('   3. Ve a: Setup > My Account > My Account');
    console.log('   4. Busca el campo "Passhash" y cópialo');
    process.exit(1);
  });
