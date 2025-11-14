/**
 * 🔧 Restaurar CABASE a producción + Crear test con sensor 13684
 * 
 * 1. Restaurar regla ID 6 (CABASE) a valores de producción
 * 2. Crear regla de prueba para sensor 13684 (umbral bajo para testing)
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
    console.log('🔧 PASO 1: Restaurar CABASE a producción\n');
    
    // Restaurar regla 6 (CABASE)
    const { data: restored, error: restoreError } = await supabase
      .from('alert_rules')
      .update({
        name: 'CABASE > 8000 Mbit/s',
        threshold: 8000,
        cooldown: 1800, // 30 minutos
        recipients: [
          'agustin.scutari@it-tel.com.ar',
          'md@it-tel.com.ar',
          'ja@it-tel.com.ar'
        ]
      })
      .eq('id', 6)
      .select()
      .single();

    if (restoreError) throw restoreError;

    console.log('✅ Regla CABASE restaurada:');
    console.log(`   Umbral: ${restored.threshold} Mbit/s`);
    console.log(`   Cooldown: ${restored.cooldown}s (${restored.cooldown / 60} min)`);
    console.log(`   Recipients: ${restored.recipients.length} personas\n`);

    console.log('🔧 PASO 2: Crear regla de TEST para sensor 13684\n');

    // Crear regla de prueba para sensor 13684 (WAN USITTEL)
    const { data: newRule, error: createError } = await supabase
      .from('alert_rules')
      .insert({
        name: '🧪 TEST 13684 > 50 Mbit/s',
        sensor_id: '13684',
        condition: 'slow',
        threshold: 50, // Umbral muy bajo para que siempre dispare
        priority: 'high',
        channels: ['email'],
        recipients: ['agustin.scutari@it-tel.com.ar'],
        cooldown: 0, // Sin cooldown para testing
        enabled: true,
        created_at: Math.floor(Date.now() / 1000)
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log('✅ Regla de TEST creada:');
    console.log(`   ID: ${newRule.id}`);
    console.log(`   Nombre: ${newRule.name}`);
    console.log(`   Sensor: 13684 (WAN USITTEL)`);
    console.log(`   Umbral: ${newRule.threshold} Mbit/s`);
    console.log(`   Cooldown: ${newRule.cooldown}s`);
    console.log(`   Recipient: agustin.scutari@it-tel.com.ar\n`);

    console.log('🎯 ¡Listo!');
    console.log('\n📋 RESUMEN:');
    console.log('   1. CABASE restaurada a valores de producción (8000 Mbit/s, 30 min cooldown)');
    console.log('   2. Nueva regla de TEST creada para sensor 13684');
    console.log('   3. Sensor 13684 tiene ~170-200 Mbit/s → Siempre > 50 Mbit/s');
    console.log('   4. En el próximo GitHub Actions deberías recibir email por sensor 13684\n');

    console.log('⚠️ NOTA: Si no llegan emails, el problema es el deployment de Vercel.');
    console.log(`Para eliminar la regla de test luego: node scripts/delete-test-rule.js ${newRule.id}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
