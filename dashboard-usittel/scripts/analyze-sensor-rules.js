/**
 * 🔍 Análisis detallado de sensores vs reglas
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

// Sensores reales según el usuario
const SENSORES_REALES = {
  usittel: [
    { id: '13682', nombre: 'CABASE' },
    { id: '13684', nombre: 'IPLANxARSAT' },
    { id: '13683', nombre: 'TECO' },
    { id: '2137', nombre: 'ITTEL-RDA-1-TDL (vlan500-WAN) - RDA' },
    { id: '13673', nombre: 'ITTEL-RDB-1-TDL (RDB-DTV) - DTV' },
    { id: '13726', nombre: '(080) WAN-to-RDB' }
  ],
  laranet: [
    { id: '5159', nombre: 'sfp28-10-WANxIPLAN' },
    { id: '4737', nombre: 'sfp28-12-WAN1-PPAL' },
    { id: '3942', nombre: 'sfp-sfpplus1-WAN LARA1-RDA-1-LARA' },
    { id: '5187', nombre: 'VLAN500-WAN (Lomas de Eziza)' },
    { id: '4736', nombre: 'sfp28-11-WAN2-BACKUP' },
    { id: '6689', nombre: 'IPTV-Modulador 1' },
    { id: '4665', nombre: 'VLAN500-WAN (LARA 2.2)' },
    { id: '4642', nombre: 'vlan500-iBGP (LARA 2.1)' }
  ]
};

async function analyzeRules() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ANÁLISIS: SENSORES REALES vs REGLAS EN BD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Obtener todas las reglas DOWN
  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .eq('condition', 'down')
    .order('sensor_id');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📊 SENSORES REALES DE USITTEL:\n');
  SENSORES_REALES.usittel.forEach((sensor, idx) => {
    const rule = rules.find(r => r.sensor_id === sensor.id);
    const emoji = rule ? '✅' : '❌';
    console.log(`${idx + 1}. ${emoji} [${sensor.id}] ${sensor.nombre}`);
    if (rule) {
      console.log(`   Regla: "${rule.name}" (ID: ${rule.id})`);
    } else {
      console.log(`   ⚠️  FALTA REGLA`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 SENSORES REALES DE LARANET:\n');
  SENSORES_REALES.laranet.forEach((sensor, idx) => {
    const rule = rules.find(r => r.sensor_id === sensor.id);
    const emoji = rule ? '✅' : '❌';
    console.log(`${idx + 1}. ${emoji} [${sensor.id}] ${sensor.nombre}`);
    if (rule) {
      console.log(`   Regla: "${rule.name}" (ID: ${rule.id})`);
    } else {
      console.log(`   ⚠️  FALTA REGLA`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Buscar reglas que NO corresponden a ningún sensor real
  const allRealSensorIds = [
    ...SENSORES_REALES.usittel.map(s => s.id),
    ...SENSORES_REALES.laranet.map(s => s.id)
  ];

  const orphanRules = rules.filter(r => !allRealSensorIds.includes(r.sensor_id));
  
  if (orphanRules.length > 0) {
    console.log('⚠️  REGLAS HUÉRFANAS (no corresponden a sensores reales):\n');
    orphanRules.forEach(rule => {
      const detectedLocation = parseInt(rule.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
      console.log(`❌ [${rule.id}] "${rule.name}"`);
      console.log(`   Sensor: ${rule.sensor_id}`);
      console.log(`   Ubicación detectada: ${detectedLocation}`);
      console.log(`   ⚠️  Este sensor NO existe en la lista real\n`);
    });
  } else {
    console.log('✅ No hay reglas huérfanas\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Detección incorrecta del sensor 2137
  const rda2137 = rules.find(r => r.sensor_id === '2137');
  if (rda2137) {
    console.log('🔍 ANÁLISIS ESPECIAL: SENSOR 2137 (RDA)\n');
    console.log(`Regla: "${rda2137.name}" (ID: ${rda2137.id})`);
    console.log(`Sensor ID: ${rda2137.sensor_id}`);
    console.log(`Ubicación según ID numérico: ${parseInt(rda2137.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET'}`);
    console.log(`Ubicación REAL según usuario: USITTEL ✅\n`);
    console.log('⚠️  PROBLEMA DETECTADO:');
    console.log('   El sensor 2137 < 10000, por lo que el código lo detecta como LARANET');
    console.log('   Pero en realidad pertenece a USITTEL TANDIL\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RESUMEN:\n');
  console.log(`Sensores USITTEL esperados: ${SENSORES_REALES.usittel.length}`);
  console.log(`Sensores LARANET esperados: ${SENSORES_REALES.laranet.length}`);
  console.log(`Total esperado: ${SENSORES_REALES.usittel.length + SENSORES_REALES.laranet.length}`);
  console.log(`Total reglas DOWN en BD: ${rules.length}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

analyzeRules().catch(console.error);
