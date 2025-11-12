/**
 * 🧹 Limpiar historial de alertas
 * Eliminar alertas de traffic_spike, traffic_drop, slow, warning
 * Mantener solo alertas de DOWN y recuperación
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function cleanAlertHistory() {
  console.log('🧹 Limpiando historial de alertas...\n');
  
  // 1. Ver cuántas alertas hay por tipo
  const { data: allAlerts, error: allError } = await supabase
    .from('alert_history')
    .select('rule_id')
    .order('timestamp', { ascending: false });
  
  if (allError) {
    console.error('❌ Error consultando alertas:', allError);
    return;
  }
  
  console.log(`📊 Total de alertas en historial: ${allAlerts?.length || 0}\n`);
  
  // Obtener todas las reglas para saber cuáles son las que queremos mantener
  const { data: rules, error: rulesError } = await supabase
    .from('alert_rules')
    .select('id, name, condition');
  
  if (rulesError) {
    console.error('❌ Error consultando reglas:', rulesError);
    return;
  }
  
  // Filtrar IDs de reglas que NO son 'down' (las que queremos eliminar)
  const ruleIdsToDelete = rules
    ?.filter(r => r.condition !== 'down')
    .map(r => r.id) || [];
  
  console.log('🗑️ Reglas cuyas alertas se eliminarán:');
  rules?.filter(r => r.condition !== 'down').forEach(r => {
    console.log(`  [${r.id}] ${r.name} (${r.condition})`);
  });
  
  if (ruleIdsToDelete.length === 0) {
    console.log('\n✅ No hay alertas que eliminar (solo existen alertas de DOWN)');
    return;
  }
  
  console.log(`\n⚠️ Se eliminarán alertas de ${ruleIdsToDelete.length} reglas\n`);
  
  // Contar cuántas alertas se eliminarán
  const { count, error: countError } = await supabase
    .from('alert_history')
    .select('*', { count: 'exact', head: true })
    .in('rule_id', ruleIdsToDelete);
  
  if (countError) {
    console.error('❌ Error contando alertas:', countError);
    return;
  }
  
  console.log(`📋 Alertas a eliminar: ${count || 0}`);
  console.log(`📋 Alertas a mantener (DOWN): ${(allAlerts?.length || 0) - (count || 0)}\n`);
  
  // Eliminar
  const { error: deleteError } = await supabase
    .from('alert_history')
    .delete()
    .in('rule_id', ruleIdsToDelete);
  
  if (deleteError) {
    console.error('❌ Error eliminando alertas:', deleteError);
    return;
  }
  
  console.log(`✅ Historial limpiado exitosamente!\n`);
  
  // Verificar resultado final
  const { count: finalCount, error: finalError } = await supabase
    .from('alert_history')
    .select('*', { count: 'exact', head: true });
  
  if (!finalError) {
    console.log(`📊 Alertas restantes en historial: ${finalCount || 0}`);
    console.log('   (Solo alertas de enlaces caídos y recuperados)\n');
  }
  
  console.log('✅ Proceso completado');
}

cleanAlertHistory().catch(console.error);
