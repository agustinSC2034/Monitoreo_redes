/**
 * 🧪 Script de Prueba - Alerta con Umbral Real
 * 
 * Ejecutar desde PowerShell:
 * node scripts/test-threshold-alert.js
 */

const steps = [
  {
    title: '1. Crear regla de prueba (CABASE > 5000 Mbit/s)',
    url: 'http://localhost:3000/api/alerts/test-threshold',
    method: 'POST'
  },
  {
    title: '2. Ver todas las reglas activas',
    url: 'http://localhost:3000/api/alerts/rules',
    method: 'GET'
  },
  {
    title: '3. Forzar actualización de estado (debería disparar alerta si CABASE > 5000)',
    url: 'http://localhost:3000/api/status',
    method: 'GET'
  }
];

async function runTest() {
  console.log('🧪 Prueba de Alerta con Umbral Real\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  for (const step of steps) {
    console.log(`\n${step.title}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch(step.url, {
        method: step.method,
        headers: step.method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      });
      
      const data = await response.json();
      
      if (step.url.includes('test-threshold')) {
        console.log('✅ Regla creada:');
        console.log(`   Sensor: ${data.info?.sensor}`);
        console.log(`   Condición: ${data.info?.condition}`);
        console.log(`   Notificación: ${data.info?.notification}`);
        console.log(`   Cooldown: ${data.info?.cooldown}`);
      } else if (step.url.includes('alerts/rules')) {
        const testRule = data.data?.find(r => r.name.includes('PRUEBA'));
        if (testRule) {
          console.log('✅ Regla encontrada:');
          console.log(`   ID: ${testRule.id}`);
          console.log(`   Nombre: ${testRule.name}`);
          console.log(`   Activa: ${testRule.active ? 'SÍ' : 'NO'}`);
        }
      } else if (step.url.includes('status')) {
        console.log('✅ Estado de sensores:');
        const cabase = data.data?.find(s => s.id === '13682' || s.name?.includes('CABASE'));
        if (cabase) {
          console.log(`   CABASE: ${cabase.lastvalue}`);
          console.log(`   Estado: ${cabase.status}`);
          console.log('\n📧 Revisa tu email si el tráfico superó 5000 Mbit/s');
        }
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ Prueba completada');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Revisa tu email corporativo');
  console.log('   2. Si no llegó, verifica los logs del servidor');
  console.log('   3. Espera 2 minutos y refresca el dashboard');
  console.log('   4. Si CABASE > 5000 Mbit/s, recibirás un email cada 1 minuto\n');
}

runTest().catch(console.error);
