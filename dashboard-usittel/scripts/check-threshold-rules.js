/**
 * 📊 Ver todas las reglas de CABASE, IPLAN y TECO
 * Verificar qué reglas de umbral ya existen
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

async function checkThresholdRules() {
  console.log('📊 Verificando reglas existentes para CABASE, IPLAN y TECO...\n');

  // IDs de los sensores
  const sensorIds = ['13682', '13684', '13683']; // CABASE, IPLAN, TECO
  const sensorNames = {
    '13682': 'CABASE',
    '13684': 'IPLANxARSAT', 
    '13683': 'TECO'
  };

  for (const sensorId of sensorIds) {
    console.log(`\n📡 ${sensorNames[sensorId]} (${sensorId}):`);
    console.log('─'.repeat(50));

    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('sensor_id', sensorId)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error:', error);
      continue;
    }

    if (!rules || rules.length === 0) {
      console.log('   Sin reglas configuradas');
      continue;
    }

    rules.forEach(rule => {
      const channels = Array.isArray(rule.channels) 
        ? rule.channels 
        : JSON.parse(rule.channels);
      
      const status = rule.enabled ? '✅ ACTIVA' : '❌ DESACTIVADA';
      
      console.log(`\n   [${rule.id}] ${rule.name}`);
      console.log(`   Condición: ${rule.condition}`);
      if (rule.threshold) console.log(`   Umbral: ${rule.threshold} Mbit/s`);
      console.log(`   Canales: ${channels.join(', ')}`);
      console.log(`   Cooldown: ${rule.cooldown}s (${Math.floor(rule.cooldown / 60)} min)`);
      console.log(`   ${status}`);
    });
  }

  console.log('\n\n📝 Plan de acción:');
  console.log('─'.repeat(50));
  console.log('1. CABASE (13682): Activar regla de umbral > 8000 Mbit/s');
  console.log('2. IPLAN (13684): Activar regla de umbral > 1000 Mbit/s');
  console.log('3. TECO (13683): Activar regla de umbral > 2000 Mbit/s');
  console.log('4. Cambiar cooldown a 30 minutos (1800 segundos)');
  console.log('5. Agregar canal "telegram" a estas 3 reglas\n');
}

checkThresholdRules().catch(console.error);
