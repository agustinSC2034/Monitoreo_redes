const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRule() {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('id', 6)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Regla 6 (CABASE) actual:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n🎯 Detalles clave:');
  console.log(`  - Umbral: ${data.threshold} Mbit/s`);
  console.log(`  - Cooldown: ${data.cooldown} segundos`);
  console.log(`  - Destinatarios: ${JSON.stringify(data.recipients)}`);
  console.log(`  - Habilitada: ${data.enabled}`);
  console.log(`  - Telegram: ${data.telegram_enabled}`);
}

checkRule();
