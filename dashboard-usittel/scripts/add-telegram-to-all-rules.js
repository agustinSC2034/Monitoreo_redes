/**
 * 📱 Agregar canal de Telegram a todas las reglas de DOWN
 * Actualizar las 13 reglas (USITTEL + LARANET) para incluir Telegram
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

async function addTelegramToAllRules() {
  console.log('📱 Agregando Telegram a todas las reglas de DOWN...\n');

  // Buscar todas las reglas DOWN habilitadas
  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('condition', 'down')
    .eq('enabled', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error buscando reglas:', error);
    return;
  }

  if (!rules || rules.length === 0) {
    console.log('❌ No se encontraron reglas habilitadas');
    return;
  }

  console.log(`📋 Se encontraron ${rules.length} reglas de DOWN activas\n`);

  let updated = 0;
  let skipped = 0;

  for (const rule of rules) {
    // Parsear channels
    const currentChannels = Array.isArray(rule.channels) 
      ? rule.channels 
      : JSON.parse(rule.channels);

    // Verificar si ya tiene telegram
    if (currentChannels.includes('telegram')) {
      console.log(`⏭️  Regla ${rule.id}: ${rule.name} - Ya tiene Telegram`);
      skipped++;
      continue;
    }

    // Agregar telegram
    const newChannels = [...currentChannels, 'telegram'];

    console.log(`📤 Regla ${rule.id}: ${rule.name}`);
    console.log(`   Sensor: ${rule.sensor_id}`);
    console.log(`   Canales: ${JSON.stringify(currentChannels)} → ${JSON.stringify(newChannels)}`);

    const { error: updateError } = await supabase
      .from('alert_rules')
      .update({ channels: newChannels })
      .eq('id', rule.id);

    if (updateError) {
      console.error(`   ❌ Error actualizando regla ${rule.id}:`, updateError);
      continue;
    }

    console.log(`   ✅ Actualizada\n`);
    updated++;
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Reglas actualizadas: ${updated}`);
  console.log(`   ⏭️  Reglas omitidas (ya tenían Telegram): ${skipped}`);
  console.log(`   📱 Total de reglas con Telegram: ${updated + skipped}`);
  
  if (updated > 0) {
    console.log('\n✨ ¡Listo! Ahora todas las alertas se enviarán por Email y Telegram');
  }
}

addTelegramToAllRules().catch(console.error);
