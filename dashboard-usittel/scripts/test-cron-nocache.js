/**
 * 🧪 Probar endpoint de cron SIN CACHÉ
 * Agrega un parámetro random para hacer bypass del caché de Vercel
 */

const https = require('https');

const VERCEL_URL = 'monitoreo-redes-5krk3eh9r-agustins-projects-03ad7204.vercel.app';
const random = Math.random().toString(36).substring(7);

async function testEndpoint(location) {
  const ENDPOINT = `/api/cron/check-alerts?location=${location}&_nocache=${random}`;
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL,
      path: ENDPOINT,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Cache-Control': 'no-cache'
      }
    };

    console.log(`🌐 Llamando a: https://${VERCEL_URL}${ENDPOINT}`);
    
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`\n✅ Status: ${res.statusCode}`);
          console.log(`⏰ Timestamp: ${result.timestamp}`);
          console.log(`⏱️  Duration: ${result.duration_ms}ms`);
          console.log(`📊 Sensores: ${result.results?.length || 0}`);
          
          if (result.results && result.results.length > 0) {
            console.log(`\n📍 Sensor de prueba (CABASE):`);
            const cabase = result.results.find(r => r.sensor_id === '13682');
            if (cabase) {
              console.log(`   Status: ${cabase.status}`);
              console.log(`   Value: ${cabase.value}`);
              console.log(`   Timestamp: ${cabase.timestamp}`);
            }
          }
          
          resolve(result);
        } catch (e) {
          console.log('Respuesta (raw):', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🧪 Probando endpoint de cron (sin caché)...\n');
  
  try {
    const result = await testEndpoint('tandil');
    console.log('\n✅ Test completado exitosamente!');
    
    // Verificar si el timestamp es reciente (< 1 minuto)
    const timestamp = new Date(result.timestamp);
    const now = new Date();
    const diff = (now - timestamp) / 1000; // segundos
    
    if (diff < 60) {
      console.log(`\n🎉 El endpoint está respondiendo en tiempo real! (${diff.toFixed(0)}s de antigüedad)`);
    } else {
      console.log(`\n⚠️  ADVERTENCIA: El timestamp es viejo (${Math.floor(diff / 60)} minutos de antigüedad)`);
      console.log('    Esto indica que Vercel sigue cacheando la respuesta.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
