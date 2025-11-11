/**
 * 🔍 Investigar sensor VLAN500-iBGP (LARA 2.1)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
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

async function investigateVLAN500() {
  console.log('🔍 Buscando sensor VLAN500-iBGP (LARA 2.1)...\n');
  
  // 1. Buscar regla de alerta
  const { data: rules, error: rulesError } = await supabase
    .from('alert_rules')
    .select('*')
    .ilike('name', '%VLAN500-iBGP%');
  
  if (rulesError) {
    console.error('❌ Error consultando reglas:', rulesError);
    return;
  }
  
  console.log('📋 Reglas encontradas:', rules?.length || 0);
  if (rules && rules.length > 0) {
    rules.forEach(rule => {
      console.log('\n━━━ REGLA ━━━');
      console.log(`ID: ${rule.id}`);
      console.log(`Nombre: ${rule.name}`);
      console.log(`Sensor ID: ${rule.sensor_id}`);
      console.log(`Condición: ${rule.condition}`);
      console.log(`Habilitada: ${rule.enabled}`);
      console.log(`Canales: ${JSON.stringify(rule.channels)}`);
      console.log(`Destinatarios: ${JSON.stringify(rule.recipients)}`);
    });
  }
  
  // 2. Buscar historial reciente (últimas 24 horas)
  const yesterday = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  
  const { data: history, error: historyError } = await supabase
    .from('alert_history')
    .select('*')
    .ilike('sensor_name', '%VLAN500-iBGP%')
    .gte('timestamp', yesterday)
    .order('timestamp', { ascending: false });
  
  if (historyError) {
    console.error('❌ Error consultando historial:', historyError);
    return;
  }
  
  console.log(`\n📊 Alertas enviadas (últimas 24h): ${history?.length || 0}`);
  if (history && history.length > 0) {
    history.forEach((alert, idx) => {
      console.log(`\n━━━ Alerta #${idx + 1} ━━━`);
      console.log(`⏰ ${new Date(alert.timestamp * 1000).toLocaleString('es-AR')}`);
      console.log(`📌 Regla ID: ${alert.rule_id}`);
      console.log(`🎯 Sensor: ${alert.sensor_id} - ${alert.sensor_name}`);
      console.log(`📊 Estado: ${alert.status}`);
      console.log(`✅ Éxito: ${alert.success}`);
      console.log(`📡 Canales enviados: ${JSON.stringify(alert.channels_sent)}`);
      if (alert.error_message) {
        console.log(`❌ ERROR: ${alert.error_message}`);
      }
    });
  } else {
    console.log('ℹ️ No se encontraron alertas en las últimas 24 horas');
  }
  
  // 3. Buscar cambios de estado
  const { data: changes, error: changesError } = await supabase
    .from('status_changes')
    .select('*')
    .ilike('sensor_name', '%VLAN500-iBGP%')
    .gte('timestamp', yesterday)
    .order('timestamp', { ascending: false });
  
  if (changesError) {
    console.error('❌ Error consultando cambios:', changesError);
    return;
  }
  
  console.log(`\n🔄 Cambios de estado (últimas 24h): ${changes?.length || 0}`);
  if (changes && changes.length > 0) {
    changes.forEach((change, idx) => {
      console.log(`\n━━━ Cambio #${idx + 1} ━━━`);
      console.log(`⏰ ${new Date(change.timestamp * 1000).toLocaleString('es-AR')}`);
      console.log(`🎯 Sensor: ${change.sensor_id} - ${change.sensor_name}`);
      console.log(`📊 ${change.old_status} → ${change.new_status}`);
    });
  } else {
    console.log('ℹ️ No se encontraron cambios de estado en las últimas 24 horas');
  }
  
  // 4. Ver logs del sistema
  const { data: logs, error: logsError } = await supabase
    .from('system_logs')
    .select('*')
    .gte('timestamp', yesterday)
    .or('message.ilike.%VLAN500-iBGP%,message.ilike.%5187%')
    .order('timestamp', { ascending: false })
    .limit(20);
  
  if (logsError) {
    console.error('❌ Error consultando logs:', logsError);
    return;
  }
  
  console.log(`\n📝 Logs del sistema: ${logs?.length || 0}`);
  if (logs && logs.length > 0) {
    logs.forEach((log, idx) => {
      console.log(`\n━━━ Log #${idx + 1} ━━━`);
      console.log(`⏰ ${new Date(log.timestamp * 1000).toLocaleString('es-AR')}`);
      console.log(`🎯 ${log.level.toUpperCase()}: ${log.message}`);
    });
  }
}

investigateVLAN500().catch(console.error);
