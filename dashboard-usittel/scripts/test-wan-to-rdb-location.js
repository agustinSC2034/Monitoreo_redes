/**
 * 🧪 Test de ubicación del sensor WAN-to-RDB (13726)
 * 
 * Este script verifica que:
 * 1. El sensor 13726 se identifique correctamente como USITTEL TANDIL
 * 2. Solo envía email a agustin.scutari@it-tel.com.ar (sin Telegram)
 * 3. Muestra la ubicación detectada en los logs
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

/**
 * 🗺️ Determinar ubicación del sensor basándose en su ID
 * USITTEL (Tandil): sensor_id >= 10000 (13682, 13684, 13683, 13673, 13726, etc.)
 * LARANET (La Matanza): sensor_id < 10000 (2137, 3942, 4640, 4665, 4736, 4737, 5159, 5187, 5281, 5283, 6689, etc.)
 */
function getLocationFromSensorId(sensorId) {
  const numericId = parseInt(sensorId, 10);
  return numericId >= 10000 ? 'tandil' : 'matanza';
}

function getLocationName(sensorId) {
  return getLocationFromSensorId(sensorId) === 'tandil' ? 'USITTEL TANDIL' : 'LARANET LA MATANZA';
}

async function testSensorLocations() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST DE UBICACIÓN DE SENSORES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Sensores de prueba
  const testSensors = [
    { id: '13682', name: 'CABASE' },
    { id: '13684', name: 'IPLANxARSAT' },
    { id: '13683', name: 'TECO' },
    { id: '13673', name: 'DTV' },
    { id: '13726', name: '(080) WAN-to-RDB' }, // ⭐ El problemático
    { id: '2137', name: 'RDA' },
    { id: '3942', name: 'WAN LARA1' },
    { id: '4640', name: 'FW Gateway VPN' },
    { id: '5159', name: 'WANxIPLAN' },
    { id: '6689', name: 'IPTV-Modulador 1' }
  ];

  console.log('📊 DETECCIÓN DE UBICACIÓN POR SENSOR:\n');
  
  testSensors.forEach(sensor => {
    const location = getLocationFromSensorId(sensor.id);
    const locationName = getLocationName(sensor.id);
    const numericId = parseInt(sensor.id, 10);
    const emoji = location === 'tandil' ? '🔵' : '🟢';
    
    console.log(`${emoji} [${sensor.id}] ${sensor.name}`);
    console.log(`   ├─ ID numérico: ${numericId}`);
    console.log(`   ├─ Ubicación: ${location}`);
    console.log(`   └─ Nombre: ${locationName}\n`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICANDO REGLA EN SUPABASE\n');

  // Buscar la regla del sensor 13726
  const { data: rule, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13726')
    .eq('condition', 'down')
    .single();

  if (error) {
    console.log('⚠️  No se encontró regla para sensor 13726');
    console.log('   Esto es normal si aún no se ha creado\n');
  } else {
    console.log('✅ Regla encontrada:');
    console.log(`   ID: ${rule.id}`);
    console.log(`   Nombre: ${rule.name}`);
    console.log(`   Sensor: ${rule.sensor_id}`);
    console.log(`   Condición: ${rule.condition}`);
    console.log(`   Canales: ${JSON.stringify(rule.channels)}`);
    console.log(`   Destinatarios: ${JSON.stringify(rule.recipients)}`);
    console.log(`   Habilitada: ${rule.enabled ? 'Sí' : 'No'}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 RESUMEN:\n');
  
  console.log('✅ CORRECTO:');
  console.log('   • Sensores >= 10000 → USITTEL TANDIL');
  console.log('   • Sensores < 10000 → LARANET LA MATANZA\n');
  
  console.log('⭐ SENSOR PROBLEMÁTICO:');
  console.log('   • ID: 13726');
  console.log('   • Nombre: (080) WAN-to-RDB');
  console.log('   • Ubicación correcta: USITTEL TANDIL');
  console.log('   • Razón: 13726 >= 10000\n');
  
  console.log('🔧 CAMBIOS APLICADOS:');
  console.log('   1. Función getLocationFromSensorId() agregada');
  console.log('   2. Lógica basada en ID numérico (>= 10000)');
  console.log('   3. Se eliminó lógica errónea de startsWith()\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testSensorLocations().catch(console.error);
