/**
 * 🔧 Desactivar alertas de tráfico y slow
 * Dejar SOLO las 13 alertas de DOWN (cambio de estado)
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

async function disableTrafficAlerts() {
  console.log('🔧 Desactivando alertas de tráfico y slow...\n');
  
  // Desactivar traffic_spike, traffic_drop, slow
  const { data, error } = await supabase
    .from('alert_rules')
    .update({ enabled: false })
    .in('condition', ['traffic_spike', 'traffic_drop', 'slow'])
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ ${data.length} reglas desactivadas:\n`);
  data.forEach(rule => {
    console.log(`  [${rule.id}] ${rule.name} (${rule.condition})`);
  });
  
  // Verificar estado final
  console.log('\n\n📊 Estado final de reglas activas:\n');
  
  const { data: activeRules, error: activeError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .order('id', { ascending: true });
  
  if (activeError) {
    console.error('❌ Error:', activeError);
    return;
  }
  
  console.log(`✅ Total de reglas activas: ${activeRules.length}`);
  console.log('\nReglas activas:');
  activeRules.forEach(rule => {
    console.log(`  [${rule.id}] ${rule.name} (sensor ${rule.sensor_id}) - ${rule.condition}`);
  });
  
  // Agrupar por ubicación
  const tandil = activeRules.filter(r => ['13682', '13684', '13683', '2137', '13673'].includes(r.sensor_id));
  const matanza = activeRules.filter(r => ['5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642'].includes(r.sensor_id));
  
  console.log(`\n📍 TANDIL (USITTEL): ${tandil.length} sensores`);
  console.log(`📍 LA MATANZA (LARANET): ${matanza.length} sensores`);
  console.log(`📊 TOTAL: ${activeRules.length} alertas de DOWN activas`);
}

disableTrafficAlerts().catch(console.error);
