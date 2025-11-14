/**
 * 🗑️ Eliminar Regla de Prueba
 * 
 * Elimina la regla temporal creada para probar GitHub Actions
 * 
 * Uso: node scripts/delete-test-rule.js <rule_id>
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
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
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deleteTestRule() {
  const ruleId = process.argv[2];

  if (!ruleId) {
    console.error('❌ Debes proporcionar el ID de la regla');
    console.error('Uso: node scripts/delete-test-rule.js <rule_id>');
    process.exit(1);
  }

  console.log(`🗑️  Eliminando regla de prueba ID: ${ruleId}...\n`);

  try {
    // Primero verificar que existe
    const { data: rule, error: fetchError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (fetchError || !rule) {
      console.error('❌ No se encontró la regla con ese ID');
      process.exit(1);
    }

    console.log(`📋 Regla encontrada: ${rule.name}`);
    console.log(`🎯 Sensor: ${rule.sensor_id}`);
    console.log('');

    // Eliminar
    const { error: deleteError } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', ruleId);

    if (deleteError) throw deleteError;

    console.log('✅ Regla eliminada exitosamente!');
    console.log('🎉 El sistema vuelve a operar solo con las reglas de producción.');

  } catch (error) {
    console.error('❌ Error eliminando regla:', error.message);
    process.exit(1);
  }
}

deleteTestRule();
