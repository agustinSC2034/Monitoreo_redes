/**
 * 🤖 Script de Monitoreo Automático para GitHub Actions
 * 
 * Este script es ejecutado por GitHub Actions cada 5 minutos.
 * No depende de que alguien tenga la página abierta.
 * 
 * Estrategia:
 * GitHub Actions llama al endpoint /api/cron/check-alerts en Vercel
 * que tiene toda la lógica de monitoreo ya implementada.
 * 
 * Ventajas:
 * - No duplicamos código
 * - Usamos la misma lógica que ya funciona
 * - Más fácil de mantener
 */

const https = require('https');

// URL del endpoint en Vercel
const VERCEL_URL = process.env.VERCEL_PRODUCTION_URL || 'monitoreo-redes-ji23nj2cy-agustins-projects-03ad7204.vercel.app';
const ENDPOINT = `/api/cron/check-alerts`;

async function callVercelEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL,
      path: ENDPOINT,
      method: 'GET',
      headers: {
        'User-Agent': 'GitHub-Actions-Cron/1.0'
      }
    };

    console.log(`🌐 Llamando a: https://${VERCEL_URL}${ENDPOINT}`);
    
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve({ success: true, statusCode: res.statusCode, data: result });
          } catch (e) {
            resolve({ success: true, statusCode: res.statusCode, data: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout after 60 seconds'));
    });

    req.end();
  });
}

async function main() {
  console.log('🤖 [GitHub Actions] Iniciando monitoreo automático...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
  console.log('---');
  
  try {
    const response = await callVercelEndpoint();
    
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('📊 Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.results) {
      const checked = response.data.results.filter(r => r.checked).length;
      const total = response.data.results.length;
      console.log(`\n✅ Sensores revisados: ${checked}/${total}`);
    }
    
    console.log('\n✅ Monitoreo completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al ejecutar el monitoreo:', error.message);
    console.error('\n💡 Verifica que:');
    console.error('  - El deployment de Vercel esté activo');
    console.error('  - El endpoint /api/cron/check-alerts exista');
    console.error('  - Las variables de entorno estén configuradas en Vercel');
    process.exit(1);
  }
}

// Ejecutar
main();
