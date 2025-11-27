/**
 * 🔍 Verificar todas las alertas activas en Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkActiveRules() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICACIÓN DE ALERTAS ACTIVAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .order('sensor_id');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Agrupar por tipo
  const down = rules.filter(r => r.condition === 'down');
  const slow = rules.filter(r => r.condition === 'slow');
  const trafficLow = rules.filter(r => r.condition === 'traffic_low');
  const pruebas = rules.filter(r => r.name.includes('PRUEBA') || r.name.includes('TEST'));

  console.log('📋 RESUMEN DE ALERTAS ACTIVAS:\n');
  
  console.log(`🔴 DOWN (Caída de enlace): ${down.length} reglas`);
  const usittelDown = down.filter(r => parseInt(r.sensor_id) >= 10000);
  const laranetDown = down.filter(r => parseInt(r.sensor_id) < 10000);
  console.log(`   • USITTEL: ${usittelDown.length} sensores`);
  console.log(`   • LARANET: ${laranetDown.length} sensores`);
  console.log('');

  console.log(`🟠 SLOW (Umbral máximo): ${slow.length} reglas`);
  slow.forEach(r => {
    const loc = parseInt(r.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`   • ${r.name} - ${r.threshold} Mbit/s (${loc})`);
  });
  console.log('');

  console.log(`🟡 TRAFFIC_LOW (Umbral mínimo): ${trafficLow.length} reglas`);
  trafficLow.forEach(r => {
    const loc = parseInt(r.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`   • ${r.name} - ${r.threshold} Mbit/s (${loc})`);
  });
  console.log('');

  if (pruebas.length > 0) {
    console.log(`🧪 PRUEBAS/TEST: ${pruebas.length} reglas`);
    pruebas.forEach(r => {
      console.log(`   • ID ${r.id}: ${r.name}`);
    });
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CONFIGURACIÓN ESPERADA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔴 DOWN: 14 reglas (6 USITTEL + 8 LARANET)');
  console.log('🟠 SLOW: 3 reglas (CABASE 9000, IPLAN 1000, TECO 2000)');
  console.log('🟡 TRAFFIC_LOW: 1 regla (CABASE < 200)');
  console.log('🧪 PRUEBAS: 0 reglas\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ESTADO ACTUAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const downOk = down.length === 14 && usittelDown.length === 6 && laranetDown.length === 8;
  const slowOk = slow.length === 3;
  const trafficLowOk = trafficLow.length === 1;
  const pruebasOk = pruebas.length === 0;

  console.log(`${downOk ? '✅' : '❌'} DOWN: ${down.length} (esperado: 14)`);
  console.log(`${slowOk ? '✅' : '❌'} SLOW: ${slow.length} (esperado: 3)`);
  console.log(`${trafficLowOk ? '✅' : '❌'} TRAFFIC_LOW: ${trafficLow.length} (esperado: 1)`);
  console.log(`${pruebasOk ? '✅' : '❌'} PRUEBAS: ${pruebas.length} (esperado: 0)`);
  console.log('');

  if (!pruebasOk) {
    console.log('⚠️  ACCIÓN REQUERIDA: Desactivar reglas de prueba');
    console.log('   Ejecutar: node scripts/disable-test-rules.js\n');
  }

  if (downOk && slowOk && trafficLowOk && pruebasOk) {
    console.log('🎉 TODO CORRECTO - Configuración perfecta!\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DETALLE COMPLETO:\n');

  console.log('DOWN:');
  down.forEach(r => {
    const loc = parseInt(r.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`   [${r.sensor_id}] ${r.name} (${loc})`);
  });
  console.log('');

  if (slow.length > 0) {
    console.log('SLOW (Umbral máximo):');
    slow.forEach(r => {
      const loc = parseInt(r.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
      console.log(`   [${r.sensor_id}] ${r.name} > ${r.threshold} Mbit/s (${loc})`);
    });
    console.log('');
  }

  if (trafficLow.length > 0) {
    console.log('TRAFFIC_LOW (Umbral mínimo):');
    trafficLow.forEach(r => {
      const loc = parseInt(r.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
      console.log(`   [${r.sensor_id}] ${r.name} < ${r.threshold} Mbit/s (${loc})`);
    });
    console.log('');
  }
}

checkActiveRules().catch(console.error);
