/**
 * 🧪 Crear regla de prueba: sfp28-10-WANxIPLAN > 100 Mbit/s
 * Sensor: 5159 (LARANET)
 * Email solo a: agustin.scutari@it-tel.com.ar
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

async function createTestRule() {
  console.log('🧪 Creando regla de prueba para sfp28-10-WANxIPLAN...\n');

  const testRule = {
    name: '🧪 PRUEBA: sfp28-10-WANxIPLAN > 100 Mbit/s',
    sensor_id: '5159',
    condition: 'slow', // Umbral máximo
    threshold: 100, // Mbit/s
    channels: ['email'], // Solo email
    recipients: ['agustin.scutari@it-tel.com.ar'], // Solo Agustín
    cooldown: 0, // Sin cooldown para pruebas
    priority: 'high',
    enabled: true,
    created_at: Math.floor(Date.now() / 1000)
  };

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '5159')
    .eq('condition', 'slow')
    .ilike('name', '%PRUEBA%');

  if (existing && existing.length > 0) {
    console.log('⚠️  Ya existe una regla de prueba para este sensor');
    console.log(`   ID: ${existing[0].id}`);
    console.log(`   Eliminando regla anterior...\n`);
    
    await supabase
      .from('alert_rules')
      .delete()
      .eq('id', existing[0].id);
  }

  // Crear nueva regla
  const { data, error } = await supabase
    .from('alert_rules')
    .insert(testRule)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando regla:', error);
    return;
  }

  console.log('✅ Regla de prueba creada exitosamente!\n');
  console.log('📋 Detalles:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Sensor: 5159 - sfp28-10-WANxIPLAN`);
  console.log(`   Condición: Tráfico > 100 Mbit/s`);
  console.log(`   Email: agustin.scutari@it-tel.com.ar`);
  console.log(`   Estado: ✅ ACTIVA\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏰ ESPERANDO GITHUB ACTIONS...');
  console.log('   Próxima ejecución: En los próximos 5 minutos');
  console.log(`   Tráfico actual: ~3070 Mbit/s (> 100 Mbit/s) ✓`);
  console.log('   La alerta debería dispararse en el próximo ciclo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📧 Recibirás un email con:');
  console.log('   • Mensaje de alerta');
  console.log('   • Gráfico del sensor (capturado en el momento)');
  console.log('   • Destinatario: agustin.scutari@it-tel.com.ar\n');

  console.log('🗑️  Para eliminar la regla después de probar:');
  console.log(`   node scripts/delete-test-rule.js ${data.id}\n`);

  // Guardar ID para eliminar después
  fs.writeFileSync(
    path.join(__dirname, 'temp_test_rule_id.txt'),
    data.id.toString()
  );
}

createTestRule().catch(console.error);
