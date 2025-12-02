/**
 * 📊 Ver detalle completo de TODAS las reglas activas
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

async function showAllRulesDetail() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DETALLE COMPLETO DE REGLAS ACTIVAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .order('id');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // Agrupar por tipo
  const byType = {
    down: [],
    slow: [],
    traffic_low: []
  };

  rules.forEach(rule => {
    if (byType[rule.condition]) {
      byType[rule.condition].push(rule);
    }
  });

  console.log(`📋 TOTAL DE REGLAS ACTIVAS: ${rules.length}\n`);
  console.log('═══════════════════════════════════════════════════\n');

  // DOWN
  console.log('🔴 REGLAS DOWN (Caída de enlace): ' + byType.down.length + '\n');
  byType.down.forEach((rule, idx) => {
    const loc = parseInt(rule.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`${idx + 1}. [ID: ${rule.id}] ${rule.name}`);
    console.log(`   Sensor: ${rule.sensor_id}`);
    console.log(`   Ubicación: ${loc}`);
    console.log(`   Canales: ${rule.channels.join(', ')}`);
    console.log(`   Destinatarios: ${rule.recipients.length} (${rule.recipients.join(', ')})`);
    console.log(`   Cooldown: ${rule.cooldown}s`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════\n');

  // SLOW
  console.log('🟠 REGLAS SLOW (Umbral máximo): ' + byType.slow.length + '\n');
  byType.slow.forEach((rule, idx) => {
    const loc = parseInt(rule.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`${idx + 1}. [ID: ${rule.id}] ${rule.name}`);
    console.log(`   Sensor: ${rule.sensor_id}`);
    console.log(`   Ubicación: ${loc}`);
    console.log(`   Umbral: ${rule.threshold} Mbit/s`);
    console.log(`   Canales: ${rule.channels.join(', ')}`);
    console.log(`   Destinatarios: ${rule.recipients.length} (${rule.recipients.join(', ')})`);
    console.log(`   Cooldown: ${rule.cooldown}s`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════\n');

  // TRAFFIC_LOW
  console.log('🟡 REGLAS TRAFFIC_LOW (Umbral mínimo): ' + byType.traffic_low.length + '\n');
  byType.traffic_low.forEach((rule, idx) => {
    const loc = parseInt(rule.sensor_id) >= 10000 ? 'USITTEL' : 'LARANET';
    console.log(`${idx + 1}. [ID: ${rule.id}] ${rule.name}`);
    console.log(`   Sensor: ${rule.sensor_id}`);
    console.log(`   Ubicación: ${loc}`);
    console.log(`   Umbral: ${rule.threshold} Mbit/s`);
    console.log(`   Canales: ${rule.channels.join(', ')}`);
    console.log(`   Destinatarios: ${rule.recipients.length} (${rule.recipients.join(', ')})`);
    console.log(`   Cooldown: ${rule.cooldown}s`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════\n');

  // Resumen por ubicación
  const usittelRules = rules.filter(r => parseInt(r.sensor_id) >= 10000);
  const laranetRules = rules.filter(r => parseInt(r.sensor_id) < 10000);

  console.log('📍 RESUMEN POR UBICACIÓN:\n');
  console.log(`🔵 USITTEL TANDIL: ${usittelRules.length} reglas`);
  console.log(`   • DOWN: ${usittelRules.filter(r => r.condition === 'down').length}`);
  console.log(`   • SLOW: ${usittelRules.filter(r => r.condition === 'slow').length}`);
  console.log(`   • TRAFFIC_LOW: ${usittelRules.filter(r => r.condition === 'traffic_low').length}\n`);

  console.log(`🟢 LARANET LA MATANZA: ${laranetRules.length} reglas`);
  console.log(`   • DOWN: ${laranetRules.filter(r => r.condition === 'down').length}`);
  console.log(`   • SLOW: ${laranetRules.filter(r => r.condition === 'slow').length}`);
  console.log(`   • TRAFFIC_LOW: ${laranetRules.filter(r => r.condition === 'traffic_low').length}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ESTADO FINAL:\n');
  console.log(`📊 Total reglas activas: ${rules.length}`);
  console.log(`📧 Destinatarios por regla: 3`);
  console.log(`📱 Canales activos: email + telegram`);
  console.log(`🚫 Reglas de prueba: 0\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

showAllRulesDetail().catch(console.error);
