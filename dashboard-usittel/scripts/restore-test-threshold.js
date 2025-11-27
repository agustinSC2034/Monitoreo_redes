/**
 * 🔄 Restaurar configuración original de la regla de umbral mínimo
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

async function restoreOriginalConfig() {
  console.log('🔄 Restaurando configuración original...\n');

  // Leer configuración guardada
  const configPath = path.join(__dirname, 'temp_original_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ No se encontró archivo temp_original_config.json');
    console.log('   Probablemente la configuración ya fue restaurada.\n');
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('📋 Configuración original:');
  console.log(`   Canales: ${JSON.stringify(config.originalChannels)}`);
  console.log(`   Destinatarios: ${JSON.stringify(config.originalRecipients)}\n`);

  // Restaurar
  const { error } = await supabase
    .from('alert_rules')
    .update({
      channels: config.originalChannels,
      recipients: config.originalRecipients
    })
    .eq('id', config.ruleId);

  if (error) {
    console.error('❌ Error restaurando configuración:', error);
    return;
  }

  console.log('✅ Configuración restaurada exitosamente\n');

  // Eliminar archivo temporal
  fs.unlinkSync(configPath);
  console.log('🗑️  Archivo temporal eliminado\n');
}

restoreOriginalConfig().catch(console.error);
