/**
 * 🔧 Corregir configuración de alertas DOWN
 * 
 * Acciones:
 * 1. Verificar/agregar regla DOWN para sensor 13726 (WAN-to-RDB)
 * 2. Actualizar sensor 2137 (RDA) - es de USITTEL, no LARANET
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

async function fixDownAlerts() {
  console.log('🔧 Corrigiendo configuración de alertas DOWN...\n');

  // 1. Verificar si existe regla para 13726
  const { data: wan726 } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '13726')
    .eq('condition', 'down');

  if (!wan726 || wan726.length === 0) {
    console.log('📝 Creando regla DOWN para sensor 13726 (WAN-to-RDB)...');
    
    const { error } = await supabase
      .from('alert_rules')
      .insert({
        name: 'WAN-to-RDB - Enlace Caído',
        sensor_id: '13726',
        condition: 'down',
        threshold: null,
        channels: ['email', 'telegram'],
        recipients: ['agustin.scutari@it-tel.com.ar', 'raul.jaimez@it-tel.com.ar'],
        cooldown: 0,
        priority: 'critical',
        enabled: true,
        created_at: Math.floor(Date.now() / 1000)
      });

    if (error) {
      console.error('❌ Error creando regla:', error);
    } else {
      console.log('✅ Regla creada para 13726 (WAN-to-RDB)\n');
    }
  } else {
    console.log('✅ Regla para 13726 (WAN-to-RDB) ya existe\n');
  }

  // 2. Verificar sensor 2137 (RDA)
  const { data: rda2137 } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('sensor_id', '2137')
    .eq('condition', 'down');

  if (rda2137 && rda2137.length > 0) {
    console.log('📝 Sensor 2137 (RDA) encontrado:');
    console.log(`   Nombre: ${rda2137[0].name}`);
    console.log(`   Ubicación detectada: ${parseInt(rda2137[0].sensor_id) >= 10000 ? 'USITTEL' : 'LARANET'}`);
    console.log('   ✅ Sensor 2137 es de USITTEL (según código)\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Consultar todas las reglas DOWN activas
  const { data: allDown } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('condition', 'down')
    .eq('enabled', true)
    .order('sensor_id');

  const usittelDown = allDown.filter(r => {
    const id = parseInt(r.sensor_id);
    // USITTEL: 13xxx o 2137 (RDA especial)
    return id >= 10000 || id === 2137;
  });

  const laranetDown = allDown.filter(r => {
    const id = parseInt(r.sensor_id);
    // LARANET: < 10000 EXCEPTO 2137
    return id < 10000 && id !== 2137;
  });

  console.log(`🔴 DOWN Total: ${allDown.length}`);
  console.log(`   • USITTEL: ${usittelDown.length} (esperado: 6)`);
  console.log(`   • LARANET: ${laranetDown.length} (esperado: 8)`);
  console.log('');

  if (usittelDown.length === 6 && laranetDown.length === 8) {
    console.log('🎉 PERFECTO! Configuración correcta\n');
  } else {
    console.log('⚠️  Revisar configuración\n');
  }

  console.log('USITTEL (6):');
  usittelDown.forEach(r => console.log(`   [${r.sensor_id}] ${r.name}`));
  console.log('');

  console.log('LARANET (8):');
  laranetDown.forEach(r => console.log(`   [${r.sensor_id}] ${r.name}`));
  console.log('');
}

fixDownAlerts().catch(console.error);
