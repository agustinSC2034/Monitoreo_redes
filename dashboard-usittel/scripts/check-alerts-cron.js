/**
 * 🤖 Script de Monitoreo Automático para GitHub Actions
 * 
 * Este script es ejecutado por GitHub Actions cada 5 minutos.
 * No depende de que alguien tenga la página abierta.
 * 
 * Estrategia:
 * GitHub Actions llama a los endpoints de Vercel para AMBAS ubicaciones:
 * - /api/cron/check-alerts?location=tandil (USITTEL)
 * - /api/cron/check-alerts?location=matanza (LARANET)
 * 
 * Ventajas:
 * - No duplicamos código
 * - Usamos la misma lógica que ya funciona
 * - Monitoreo completo de ambas ubicaciones
 * - Más fácil de mantener
 */

const https = require('https');

// URL del endpoint en Vercel
const VERCEL_URL = process.env.VERCEL_PRODUCTION_URL || 'monitoreo-redes-ji23nj2cy-agustins-projects-03ad7204.vercel.app';

async function callVercelEndpoint(location) {
  // Agregar timestamp para evitar caché de Vercel
  const nocache = Date.now();
  const ENDPOINT = `/api/cron/check-alerts?location=${location}&_t=${nocache}`;
  
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
  console.log('🤖 [GitHub Actions] Iniciando monitoreo automático de AMBAS ubicaciones...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
  console.log('---\n');
  
  let allSuccess = true;
  
  // 1️⃣ Monitorear TANDIL (USITTEL)
  console.log('🏢 [TANDIL - USITTEL] Iniciando chequeo...');
  try {
    const responseTandil = await callVercelEndpoint('tandil');
    
    console.log(`✅ [TANDIL] Status: ${responseTandil.statusCode}`);
    console.log('📊 [TANDIL] Respuesta del servidor:');
    console.log(JSON.stringify(responseTandil.data, null, 2));
    
    if (responseTandil.data.results) {
      const checked = responseTandil.data.results.filter(r => r.checked).length;
      const total = responseTandil.data.results.length;
      console.log(`✅ [TANDIL] Sensores revisados: ${checked}/${total}`);
    }
    
  } catch (error) {
    console.error('❌ [TANDIL] Error:', error.message);
    allSuccess = false;
  }
  
  console.log('\n---\n');
  
  // 2️⃣ Monitorear LA MATANZA (LARANET)
  console.log('🏢 [LA MATANZA - LARANET] Iniciando chequeo...');
  try {
    const responseMatanza = await callVercelEndpoint('matanza');
    
    console.log(`✅ [MATANZA] Status: ${responseMatanza.statusCode}`);
    console.log('📊 [MATANZA] Respuesta del servidor:');
    console.log(JSON.stringify(responseMatanza.data, null, 2));
    
    if (responseMatanza.data.results) {
      const checked = responseMatanza.data.results.filter(r => r.checked).length;
      const total = responseMatanza.data.results.length;
      console.log(`✅ [MATANZA] Sensores revisados: ${checked}/${total}`);
    }
    
  } catch (error) {
    console.error('❌ [MATANZA] Error:', error.message);
    allSuccess = false;
  }
  
  console.log('\n---\n');
  
  if (allSuccess) {
    console.log('✅ Monitoreo completado exitosamente para AMBAS ubicaciones');
    process.exit(0);
  } else {
    console.error('⚠️ Monitoreo completado con errores en alguna ubicación');
    console.error('\n💡 Verifica que:');
    console.error('  - El deployment de Vercel esté activo');
    console.error('  - El endpoint /api/cron/check-alerts exista');
    console.error('  - Las variables de entorno estén configuradas en Vercel');
    process.exit(1);
  }
}

// Ejecutar
main();
