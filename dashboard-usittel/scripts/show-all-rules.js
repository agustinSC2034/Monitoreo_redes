/**
 * 🔍 Ver todas las reglas actuales
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

async function showAllRules() {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📋 Total de reglas: ${data.length}\n`);
  
  // Agrupar por condición
  const byCondition = {};
  data.forEach(rule => {
    if (!byCondition[rule.condition]) {
      byCondition[rule.condition] = [];
    }
    byCondition[rule.condition].push(rule);
  });
  
  Object.keys(byCondition).forEach(condition => {
    console.log(`\n━━━ ${condition.toUpperCase()} (${byCondition[condition].length} reglas) ━━━`);
    byCondition[condition].forEach(rule => {
      console.log(`  [${rule.id}] ${rule.name} (sensor ${rule.sensor_id}) - Enabled: ${rule.enabled}`);
    });
  });
  
  console.log('\n\n📊 RESUMEN:');
  Object.keys(byCondition).forEach(condition => {
    const enabled = byCondition[condition].filter(r => r.enabled).length;
    const disabled = byCondition[condition].filter(r => !r.enabled).length;
    console.log(`  ${condition}: ${enabled} activas, ${disabled} desactivadas`);
  });
}

showAllRules().catch(console.error);
