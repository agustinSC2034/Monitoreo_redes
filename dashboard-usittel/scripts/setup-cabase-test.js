/**
 * 🔧 Configurar CABASE para testing
 * 
 * 1. Eliminar regla de prueba ID 24
 * 2. Modificar regla ID 6: CABASE > 1000 Mbit/s (solo agustin.scutari@it-tel.com.ar)
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

async function setupCabaseTest() {
  console.log('🔧 Configurando CABASE para testing...\n');

  try {
    // 1. Eliminar regla de prueba ID 24
    console.log('1️⃣ Eliminando regla de prueba ID 24...');
    const { error: deleteError } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', 24);

    if (deleteError) {
      console.warn('   ⚠️  Error eliminando regla 24:', deleteError.message);
    } else {
      console.log('   ✅ Regla de prueba eliminada\n');
    }

    // 2. Modificar regla ID 6
    console.log('2️⃣ Modificando regla ID 6 (CABASE)...');
    console.log('   Cambios:');
    console.log('   - Umbral: 8000 → 1000 Mbit/s');
    console.log('   - Recipients: solo agustin.scutari@it-tel.com.ar');
    console.log('   - Cooldown: 1800s → 0s (sin cooldown para testing)');
    console.log('   - Nombre: incluye emoji de prueba\n');

    const { data: updated, error: updateError } = await supabase
      .from('alert_rules')
      .update({
        name: '🧪 TEST CABASE > 1000 Mbit/s',
        threshold: 1000,
        cooldown: 0, // Sin cooldown para que dispare siempre
        recipients: ['agustin.scutari@it-tel.com.ar']
      })
      .eq('id', 6)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('✅ Regla ID 6 actualizada exitosamente!\n');
    console.log('📋 Configuración final:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Nombre: ${updated.name}`);
    console.log(`   Sensor: ${updated.sensor_id}`);
    console.log(`   Condición: ${updated.condition}`);
    console.log(`   Umbral: ${updated.threshold} Mbit/s`);
    console.log(`   Cooldown: ${updated.cooldown}s`);
    console.log(`   Canales: ${JSON.stringify(updated.channels)}`);
    console.log(`   Recipients: ${JSON.stringify(updated.recipients)}`);
    console.log(`   Enabled: ${updated.enabled}\n`);

    console.log('🎯 ¡Listo para testing!');
    console.log('   En el próximo ciclo de GitHub Actions (cada 5 min):');
    console.log('   - CABASE tiene ~4800 Mbit/s');
    console.log('   - Umbral configurado: 1000 Mbit/s');
    console.log('   - Se disparará la alerta');
    console.log('   - Email llegará solo a: agustin.scutari@it-tel.com.ar\n');

    console.log('⏰ Próximas ejecuciones automáticas:');
    const now = new Date();
    const minute = now.getMinutes();
    const nextRun = new Date(now);
    nextRun.setMinutes(Math.ceil((minute + 1) / 5) * 5);
    nextRun.setSeconds(0);
    console.log(`   Próxima: ${nextRun.toLocaleTimeString('es-AR')}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupCabaseTest();
