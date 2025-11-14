/**
 * 🔍 Verificar TODAS las reglas del sensor 13682 (CABASE)
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
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRules() {
  console.log('🔍 Consultando TODAS las reglas del sensor 13682 (CABASE)...\n');

  try {
    // 1. Todas las reglas del sensor (sin filtrar por enabled)
    console.log('1️⃣ Todas las reglas (enabled y disabled):');
    const { data: allRules, error: allError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('sensor_id', '13682')
      .order('id', { ascending: true });

    if (allError) throw allError;

    if (allRules && allRules.length > 0) {
      allRules.forEach(rule => {
        console.log(`   [${rule.id}] ${rule.name}`);
        console.log(`       Condición: ${rule.condition}, Umbral: ${rule.threshold}, Enabled: ${rule.enabled}`);
      });
      console.log(`   Total: ${allRules.length} reglas\n`);
    } else {
      console.log('   ❌ No se encontraron reglas\n');
    }

    // 2. Solo reglas activas (como hace getAlertRuleBySensor)
    console.log('2️⃣ Solo reglas activas (enabled=true):');
    const { data: activeRules, error: activeError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('sensor_id', '13682')
      .eq('enabled', true)
      .order('id', { ascending: true });

    if (activeError) throw activeError;

    if (activeRules && activeRules.length > 0) {
      activeRules.forEach(rule => {
        console.log(`   [${rule.id}] ${rule.name}`);
        console.log(`       Condición: ${rule.condition}, Umbral: ${rule.threshold}`);
      });
      console.log(`   Total: ${activeRules.length} reglas activas\n`);
      
      // 3. Verificar si la regla 24 está en la lista
      const rule24 = activeRules.find(r => r.id === 24);
      if (rule24) {
        console.log('✅ La regla ID 24 está en las reglas activas!');
        console.log('   Esto significa que processSensorData() DEBERÍA evaluarla.\n');
      } else {
        console.log('❌ La regla ID 24 NO está en las reglas activas');
        console.log('   Verificar si está enabled=false o fue eliminada\n');
      }
    } else {
      console.log('   ❌ No se encontraron reglas activas\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRules();
