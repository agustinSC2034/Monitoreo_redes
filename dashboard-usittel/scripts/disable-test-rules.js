/**
 * 🗑️ Desactivar reglas de prueba
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

async function disableTestRules() {
  console.log('🗑️  Desactivando reglas de prueba...\n');

  // Buscar todas las reglas de prueba
  const { data: testRules } = await supabase
    .from('alert_rules')
    .select('*')
    .or('name.ilike.%PRUEBA%,name.ilike.%TEST%')
    .eq('enabled', true);

  if (!testRules || testRules.length === 0) {
    console.log('✅ No hay reglas de prueba activas\n');
    return;
  }

  console.log(`📋 Reglas de prueba encontradas: ${testRules.length}\n`);
  
  for (const rule of testRules) {
    console.log(`   • ID ${rule.id}: ${rule.name}`);
  }
  console.log('');

  // Desactivar todas
  const { error } = await supabase
    .from('alert_rules')
    .update({ enabled: false })
    .or('name.ilike.%PRUEBA%,name.ilike.%TEST%');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Reglas de prueba desactivadas correctamente\n');
}

disableTestRules().catch(console.error);
