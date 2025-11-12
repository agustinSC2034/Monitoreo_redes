/**
 * 🧪 Agregar canal de Telegram a UNA regla de prueba
 * Actualizar sensor 4642 (vlan500-iBGP) para probar Telegram
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

async function addTelegramToTestRule() {
  console.log('🧪 Agregando Telegram a regla de prueba...\n');

  // Buscar regla del sensor 4642 (vlan500-iBGP)
  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '4642')
    .eq('condition', 'down');

  if (error) {
    console.error('❌ Error buscando regla:', error);
    return;
  }

  if (!rules || rules.length === 0) {
    console.log('❌ No se encontró regla para sensor 4642');
    return;
  }

  const rule = rules[0];
  console.log('📋 Regla encontrada:');
  console.log(`   ID: ${rule.id}`);
  console.log(`   Nombre: ${rule.name}`);
  console.log(`   Sensor: ${rule.sensor_id}`);
  console.log(`   Canales actuales: ${JSON.stringify(rule.channels)}\n`);

  // Actualizar canales para incluir telegram
  const currentChannels = Array.isArray(rule.channels) 
    ? rule.channels 
    : JSON.parse(rule.channels);

  if (currentChannels.includes('telegram')) {
    console.log('✅ La regla ya tiene Telegram configurado');
    return;
  }

  const newChannels = [...currentChannels, 'telegram'];

  console.log(`📤 Actualizando canales a: ${JSON.stringify(newChannels)}`);

  const { error: updateError } = await supabase
    .from('alert_rules')
    .update({ channels: newChannels })
    .eq('id', rule.id);

  if (updateError) {
    console.error('❌ Error actualizando regla:', updateError);
    return;
  }

  console.log('✅ Regla actualizada exitosamente\n');
  console.log('🧪 Ahora puedes probar:');
  console.log('   1. Espera a que el sensor 4642 cambie de estado');
  console.log('   2. O ejecuta el cron manualmente');
  console.log('   3. Deberías recibir alertas por Email y Telegram\n');
}

addTelegramToTestRule().catch(console.error);
