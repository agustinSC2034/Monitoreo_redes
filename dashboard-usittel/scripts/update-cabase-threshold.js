/**
 * 🔧 Actualizar umbral de CABASE a 8500 Mbit/s
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

async function updateCABASEThreshold() {
  console.log('🔧 Actualizando umbral de CABASE a 9000 Mbit/s...\n');

  // Buscar regla de CABASE con umbral máximo
  const { data: cabaseRules, error: searchError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13682')
    .eq('condition', 'slow');

  if (searchError) {
    console.error('❌ Error buscando regla:', searchError);
    return;
  }

  if (!cabaseRules || cabaseRules.length === 0) {
    console.error('❌ No se encontró regla de umbral máximo para CABASE');
    return;
  }

  const rule = cabaseRules[0];
  console.log(`📋 Regla encontrada:`);
  console.log(`   ID: ${rule.id}`);
  console.log(`   Nombre: ${rule.name}`);
  console.log(`   Umbral actual: ${rule.threshold} Mbit/s`);
  console.log(`   Estado: ${rule.enabled ? '✅ ACTIVA' : '❌ DESACTIVADA'}\n`);

  // Actualizar a 9000 Mbit/s
  const { error: updateError } = await supabase
    .from('alert_rules')
    .update({
      threshold: 9000,
      name: 'CABASE > 9000 Mbit/s'
    })
    .eq('id', rule.id);

  if (updateError) {
    console.error('❌ Error actualizando:', updateError);
    return;
  }

  console.log('✅ Umbral actualizado exitosamente!\n');
  console.log('📊 Nuevo valor:');
  console.log('   CABASE: > 9000 Mbit/s\n');
}

updateCABASEThreshold().catch(console.error);
