/**
 * Script para verificar que Vercel tenga el deployment correcto
 */

const https = require('https');

const VERCEL_URL = 'https://monitoreo-redes-5krk3eh9r-agustins-projects-03ad7204.vercel.app';

console.log('🔍 Verificando deployment de Vercel...\n');

https.get(`${VERCEL_URL}/api/cron/check-alerts?location=tandil&_t=${Date.now()}`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ Endpoint responde correctamente');
      console.log(`   Timestamp: ${json.timestamp}`);
      console.log(`   Sensores: ${json.results?.length || 0}`);
      
      if (json.results && json.results.length > 0) {
        const sensor13684 = json.results.find(r => r.sensor_id === '13684');
        if (sensor13684) {
          console.log(`\n📊 Sensor 13684:`);
          console.log(`   Estado: ${sensor13684.status}`);
          console.log(`   Valor: ${sensor13684.value}`);
        }
      }
      
      console.log('\n🔍 AHORA REVISA LOS LOGS DE VERCEL');
      console.log('   Deberías ver líneas como:');
      console.log('   🔍 [DEBUG] Evaluando regla ID 25...');
      console.log('   ↳ Regla tipo SLOW - NO verifica estado, solo cooldown');
      console.log('\n   Si NO ves esos logs, el deployment está usando código viejo.');
      
    } catch (e) {
      console.error('❌ Error parseando respuesta');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error en request:', err.message);
});
