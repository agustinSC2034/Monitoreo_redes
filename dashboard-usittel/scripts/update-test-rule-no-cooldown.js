/**
 * ⚙️ Actualizar regla de prueba para que NO tenga cooldown
 * Así te sigue llegando en cada ejecución (cada 5 minutos)
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

async function updateTestRule() {
  console.log('⚙️ Actualizando regla de prueba para eliminar cooldown...\n');

  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .update({
        cooldown: 0, // Sin cooldown, se dispara en cada ejecución
      })
      .eq('id', 24)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Regla actualizada exitosamente!');
    console.log(`📋 ID: ${data.id}`);
    console.log(`📧 Destinatario: ${data.recipients[0]}`);
    console.log(`⏱️  Cooldown: ${data.cooldown}s (SIN COOLDOWN - se ejecuta siempre)`);
    console.log('');
    console.log('🔄 Ahora te llegará un email cada 5 minutos.');
    console.log('   Después de recibir 2-3 emails, ejecuta:');
    console.log('   node scripts/delete-test-rule.js 24');
    console.log('');

  } catch (error) {
    console.error('❌ Error actualizando regla:', error.message);
    process.exit(1);
  }
}

updateTestRule();
