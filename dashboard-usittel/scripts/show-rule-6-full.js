/**
 * Ver toda la configuración de la regla 6
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function showRule() {
  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', 6)
      .single();

    if (error) throw error;

    console.log('📋 CONFIGURACIÓN COMPLETA DE REGLA 6:\n');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n\n🎯 RESUMEN:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Nombre: ${data.name}`);
    console.log(`   Sensor ID: ${data.sensor_id} ⚠️ ${data.sensor_id === '13682' ? 'CORRECTO' : 'INCORRECTO - Debería ser 13682'}`);
    console.log(`   Condición: ${data.condition}`);
    console.log(`   Umbral: ${data.threshold} Mbit/s`);
    console.log(`   Cooldown: ${data.cooldown}s`);
    console.log(`   Habilitada: ${data.enabled}`);
    console.log(`   Canales: ${JSON.stringify(data.channels)}`);
    console.log(`   Recipients: ${JSON.stringify(data.recipients)}`);
    console.log(`   Telegram: ${data.telegram_enabled}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showRule();
