/**
 * 🧪 Test de APIs - Verificar que ambas ubicaciones funcionen
 */

const VERCEL_URL = 'https://monitoreo-redes-3jmn5u3aw-agustins-projects-03ad7204.vercel.app';

async function testAPI(location) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Probando API para ${location.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const url = `${VERCEL_URL}/api/status?location=${location}`;
  
  console.log(`📡 URL: ${url}`);
  console.log('⏱️  Esperando respuesta...\n');
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Tiempo: ${duration}ms\n`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error en respuesta:', text.substring(0, 500));
      return false;
    }
    
    const data = await response.json();
    
    console.log(`📊 Datos recibidos:`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Count: ${data.count} sensores`);
    console.log(`   Timestamp: ${data.timestamp}\n`);
    
    if (data.data && data.data.length > 0) {
      console.log(`🔍 Sensores encontrados:`);
      console.log(`${'-'.repeat(80)}`);
      
      data.data.forEach((sensor, i) => {
        console.log(`${i + 1}. ${sensor.name}`);
        console.log(`   ID: ${sensor.id} | Status: ${sensor.status} | Value: ${sensor.lastValue}`);
        console.log(`   Device: ${sensor.device}`);
        console.log('');
      });
      
      return true;
    } else {
      console.log('⚠️  No se encontraron sensores');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Iniciando test de APIs...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}\n`);
  
  // Test TANDIL
  const tandiOk = await testAPI('tandil');
  
  // Test MATANZA
  const matanzaOk = await testAPI('matanza');
  
  // Resumen
  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 RESUMEN');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`Tandil (USITTEL): ${tandiOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log(`Matanza (LARANET): ${matanzaOk ? '✅ OK' : '❌ FALLÓ'}\n`);
  
  if (tandiOk && matanzaOk) {
    console.log('🎉 ¡Todas las APIs funcionan correctamente!');
    process.exit(0);
  } else {
    console.log('⚠️  Algunas APIs fallaron - revisar logs arriba');
    process.exit(1);
  }
}

main();
