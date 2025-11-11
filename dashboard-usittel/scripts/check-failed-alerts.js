/**
 * 🔍 Investigar Alertas Fallidas
 * 
 * Consulta la base de datos para ver detalles de las alertas que fallaron
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

async function checkFailedAlerts() {
  console.log('🔍 Buscando alertas para sensor 13684 (WAN-IPLANxARSAT)...\n');
  
  // Buscar TODAS las alertas del sensor 13684
  const { data, error } = await supabase
    .from('alert_history')
    .select('*')
    .eq('sensor_id', '13684')
    .order('timestamp', { ascending: false })
    .limit(100); // Últimas 100 alertas
  
  if (error) {
    console.error('❌ Error consultando base de datos:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('ℹ️ No se encontraron alertas para sensor 13684');
    return;
  }
  
  console.log(`📊 Encontradas ${data.length} alertas del sensor 13684:\n`);
  
  data.forEach((alert, idx) => {
    console.log(`━━━ Alerta #${idx + 1} ━━━`);
    console.log(`⏰ Timestamp: ${new Date(alert.timestamp * 1000).toLocaleString('es-AR')}`);
    console.log(`📌 Regla ID: ${alert.rule_id}`);
    console.log(`🎯 Sensor: ${alert.sensor_id} - ${alert.sensor_name}`);
    console.log(`📊 Estado: ${alert.status}`);
    console.log(`💬 Mensaje: ${alert.message.substring(0, 150)}...`);
    console.log(`📧 Destinatarios: ${JSON.stringify(alert.recipients)}`);
    console.log(`✅ Éxito: ${alert.success}`);
    console.log(`📡 Canales enviados: ${JSON.stringify(alert.channels_sent)}`);
    if (alert.error_message) {
      console.log(`❌ ERROR: ${alert.error_message}`);
    }
    console.log('');
  });
  
  // No mostrar logs del sistema para simplificar
  console.log('\n✅ Consulta completada');
}

checkFailedAlerts().catch(console.error);
