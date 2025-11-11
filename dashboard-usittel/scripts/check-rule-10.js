/**
 * 🔍 Ver detalles de regla 10 (WAN-IPLANxARSAT traffic spike)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
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

async function checkRule() {
  console.log('🔍 Buscando regla ID 10...\n');
  
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('id', 10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Regla encontrada:\n');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('ℹ️ No se encontró regla con ID 10');
  }
}

checkRule().catch(console.error);
