/**
 * 🧪 Forzar disparo de alerta para testing
 * 
 * Este script llama directamente al endpoint de alertas
 * y muestra toda la información de debugging
 */

const https = require('https');

const VERCEL_URL = 'https://monitoreo-redes-5krk3eh9r-agustins-projects-03ad7204.vercel.app';

async function makeRequest(location) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const url = `${VERCEL_URL}/api/cron/check-alerts?location=${location}&_t=${timestamp}`;
    
    console.log(`\n📞 Llamando a: ${location.toUpperCase()}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📊 Respuesta:`);
          console.log(JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.error('❌ Error parseando respuesta:', e.message);
          console.log('Raw data:', data);
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Error en request a ${location}:`, err.message);
      reject(err);
    });
  });
}

async function main() {
  console.log('🤖 FORZANDO CHEQUEO DE ALERTAS');
  console.log('================================\n');
  
  try {
    // Tandil primero (donde está CABASE - sensor 13682)
    await makeRequest('tandil');
    
    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Luego Matanza
    await makeRequest('matanza');
    
    console.log('\n✅ Test completado');
    console.log('\n🔍 PASOS SIGUIENTES:');
    console.log('1. Revisa tu email (agustin.scutari@it-tel.com.ar)');
    console.log('2. Si NO llega email, revisa los logs de Vercel');
    console.log('3. Busca en los logs: "🚨 Disparando alerta" o "📧 Email enviado"');
    
  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
  }
}

main();
