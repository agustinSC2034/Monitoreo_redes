/**
 * 🧹 Limpiar historial de alertas de la regla de test
 * 
 * Esto elimina todos los registros de alertas de la regla ID 25
 * para que el sistema pueda disparar nuevas alertas sin bloqueos
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

async function main() {
  try {
    console.log('🧹 Limpiando historial de alertas de la regla de test (ID 25)...\n');
    
    // Primero ver cuántos registros hay
    const { count, error: countError } = await supabase
      .from('alert_history')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', 25);
    
    if (countError) throw countError;
    
    console.log(`📊 Registros encontrados: ${count}\n`);
    
    if (count === 0) {
      console.log('✅ No hay registros para limpiar');
      return;
    }
    
    // Eliminar todos los registros de la regla 25
    const { error: deleteError } = await supabase
      .from('alert_history')
      .delete()
      .eq('rule_id', 25);
    
    if (deleteError) throw deleteError;
    
    console.log(`✅ Se eliminaron ${count} registros del historial\n`);
    console.log('🎯 Ahora el sistema puede disparar nuevas alertas sin restricciones');
    console.log('   La próxima ejecución de GitHub Actions debería enviar email\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
