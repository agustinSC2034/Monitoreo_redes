/**
 * 🔄 Restaurar configuración de producción para WAN-to-RDB
 * 
 * - Email a agustin.scutari@it-tel.com.ar y raul.jaimez@it-tel.com.ar
 * - Habilitar Telegram
 * - Mantener habilitada
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

async function restoreProductionRule() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 RESTAURAR CONFIGURACIÓN DE PRODUCCIÓN');
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

  // Restaurar configuración de producción
  const { data: updated, error: updateError } = await supabase
    .from('alert_rules')
    .update({
      channels: ['email', 'telegram'], // Email + Telegram
      recipients: [
        'agustin.scutari@it-tel.com.ar',
        'ja@it-tel.com.ar',
        'md@it-tel.com.ar'
      ], // 3 destinatarios
      enabled: true
    })
    .eq('id', existingRule.id)
    .select()
    .single();

  if (updateError) {
    console.log('❌ Error actualizando regla:', updateError.message);
    return;
  }

  console.log('✅ CONFIGURACIÓN DE PRODUCCIÓN RESTAURADA:');
  console.log(`   ID: ${updated.id}`);
  console.log(`   Nombre: ${updated.name}`);
  console.log(`   Canales: ${JSON.stringify(updated.channels)}`);
  console.log(`   Destinatarios: ${JSON.stringify(updated.recipients)}`);
  console.log(`   Habilitada: ${updated.enabled ? 'Sí' : 'No'}`);
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PRODUCCIÓN ACTIVADA\n');
  console.log('📧 Destinatarios:');
  console.log('   • agustin.scutari@it-tel.com.ar');
  console.log('   • ja@it-tel.com.ar');
  console.log('   • md@it-tel.com.ar\n');
  console.log('📱 Canales:');
  console.log('   • Email');
  console.log('   • Telegram\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

restoreProductionRule().catch(console.error);
