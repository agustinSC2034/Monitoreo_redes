/**
 * ⚙️ Activar y configurar reglas de umbral de tráfico
 * CABASE > 8000 Mbit/s, IPLAN > 1000 Mbit/s, TECO > 2000 Mbit/s
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

async function setupTrafficThresholdRules() {
  console.log('⚙️ Configurando reglas de umbral de tráfico...\n');

  const COOLDOWN_30_MIN = 1800; // 30 minutos en segundos
  const CHANNELS = ['email', 'telegram'];
  const RECIPIENTS = [
    'agustin.scutari@it-tel.com.ar',
    'md@it-tel.com.ar',
    'ja@it-tel.com.ar'
  ];

  // 1. Actualizar regla de CABASE (ID 6)
  console.log('1️⃣ Actualizando regla de CABASE > 8000 Mbit/s (ID 6)...');
  const { error: error1 } = await supabase
    .from('alert_rules')
    .update({
      enabled: true,
      cooldown: COOLDOWN_30_MIN,
      channels: CHANNELS,
      recipients: RECIPIENTS
    })
    .eq('id', 6);

  if (error1) {
    console.error('   ❌ Error:', error1);
  } else {
    console.log('   ✅ CABASE configurada (umbral: 8000 Mbit/s, cooldown: 30 min)\n');
  }

  // 2. Actualizar regla de IPLAN (ID 7)
  console.log('2️⃣ Actualizando regla de IPLAN > 1000 Mbit/s (ID 7)...');
  const { error: error2 } = await supabase
    .from('alert_rules')
    .update({
      enabled: true,
      cooldown: COOLDOWN_30_MIN,
      channels: CHANNELS,
      recipients: RECIPIENTS
    })
    .eq('id', 7);

  if (error2) {
    console.error('   ❌ Error:', error2);
  } else {
    console.log('   ✅ IPLAN configurada (umbral: 1000 Mbit/s, cooldown: 30 min)\n');
  }

  // 3. Crear nueva regla para TECO > 2000 Mbit/s
  console.log('3️⃣ Creando nueva regla para TECO > 2000 Mbit/s...');
  
  // Verificar si ya existe
  const { data: existingTeco } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13683')
    .eq('condition', 'slow');

  if (existingTeco && existingTeco.length > 0) {
    console.log('   ⚠️  Ya existe una regla de umbral para TECO, actualizándola...');
    const { error: error3 } = await supabase
      .from('alert_rules')
      .update({
        enabled: true,
        threshold: 2000,
        cooldown: COOLDOWN_30_MIN,
        channels: CHANNELS,
        recipients: RECIPIENTS
      })
      .eq('id', existingTeco[0].id);

    if (error3) {
      console.error('   ❌ Error:', error3);
    } else {
      console.log('   ✅ TECO actualizada (umbral: 2000 Mbit/s, cooldown: 30 min)\n');
    }
  } else {
    const { error: error3 } = await supabase
      .from('alert_rules')
      .insert({
        name: 'TECO > 2000 Mbit/s',
        sensor_id: '13683',
        condition: 'slow',
        threshold: 2000,
        channels: CHANNELS,
        recipients: RECIPIENTS,
        cooldown: COOLDOWN_30_MIN,
        priority: 'medium',
        enabled: true,
        created_at: Math.floor(Date.now() / 1000)
      });

    if (error3) {
      console.error('   ❌ Error:', error3);
    } else {
      console.log('   ✅ TECO creada (umbral: 2000 Mbit/s, cooldown: 30 min)\n');
    }
  }

  // Verificar estado final
  console.log('📊 Estado final de las reglas:\n');
  
  const { data: finalRules } = await supabase
    .from('alert_rules')
    .select('*')
    .in('sensor_id', ['13682', '13684', '13683'])
    .eq('condition', 'slow')
    .order('sensor_id', { ascending: true });

  if (finalRules) {
    finalRules.forEach(rule => {
      const channels = Array.isArray(rule.channels) ? rule.channels : JSON.parse(rule.channels);
      console.log(`✅ [${rule.id}] ${rule.name}`);
      console.log(`   Sensor: ${rule.sensor_id}`);
      console.log(`   Umbral: ${rule.threshold} Mbit/s`);
      console.log(`   Cooldown: ${rule.cooldown}s (${Math.floor(rule.cooldown / 60)} min)`);
      console.log(`   Canales: ${channels.join(', ')}`);
      console.log(`   Estado: ${rule.enabled ? '✅ ACTIVA' : '❌ DESACTIVADA'}\n`);
    });
  }

  console.log('✨ Configuración completada!\n');
  console.log('📝 Resumen:');
  console.log('   • 3 reglas de umbral activadas');
  console.log('   • Cooldown: 30 minutos (evita spam)');
  console.log('   • Canales: Email + Telegram');
  console.log('   • Las 13 reglas de DOWN siguen activas (sin cambios)\n');
}

setupTrafficThresholdRules().catch(console.error);
