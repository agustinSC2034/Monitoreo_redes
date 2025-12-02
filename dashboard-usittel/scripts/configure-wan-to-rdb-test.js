/**
 * 🧪 Configurar regla WAN-to-RDB para testing
 * 
 * - Solo email a agustin.scutari@it-tel.com.ar
 * - Deshabilitar Telegram temporalmente
 * - Mantener habilitada para pruebas
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

async function configureTestRule() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 CONFIGURAR REGLA WAN-to-RDB PARA TESTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Buscar la regla del sensor 13726
  const { data: existingRule, error: findError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13726')
    .eq('condition', 'down')
    .single();

  if (findError) {
    console.log('❌ No se encontró la regla para el sensor 13726');
    console.log('   Error:', findError.message);
    return;
  }

  console.log('📋 CONFIGURACIÓN ACTUAL:');
  console.log(`   ID: ${existingRule.id}`);
  console.log(`   Nombre: ${existingRule.name}`);
  console.log(`   Canales: ${JSON.stringify(existingRule.channels)}`);
  console.log(`   Destinatarios: ${JSON.stringify(existingRule.recipients)}`);
  console.log('');

  // Actualizar regla para testing
  const { data: updated, error: updateError } = await supabase
    .from('alert_rules')
    .update({
      channels: ['email'], // Solo email, sin Telegram
      recipients: ['agustin.scutari@it-tel.com.ar'], // Solo Agustín
      enabled: true
    })
    .eq('id', existingRule.id)
    .select()
    .single();

  if (updateError) {
    console.log('❌ Error actualizando regla:', updateError.message);
    return;
  }

  console.log('✅ CONFIGURACIÓN ACTUALIZADA:');
  console.log(`   ID: ${updated.id}`);
  console.log(`   Nombre: ${updated.name}`);
  console.log(`   Canales: ${JSON.stringify(updated.channels)}`);
  console.log(`   Destinatarios: ${JSON.stringify(updated.recipients)}`);
  console.log(`   Habilitada: ${updated.enabled ? 'Sí' : 'No'}`);
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 CONFIGURACIÓN DE PRUEBA ACTIVADA\n');
  console.log('⚠️  IMPORTANTE:');
  console.log('   • Solo se enviará email a: agustin.scutari@it-tel.com.ar');
  console.log('   • NO se enviará a Telegram');
  console.log('   • Regla habilitada para pruebas\n');
  console.log('📝 PARA RESTAURAR PRODUCCIÓN:');
  console.log('   node scripts/restore-wan-to-rdb-production.js\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

configureTestRule().catch(console.error);
