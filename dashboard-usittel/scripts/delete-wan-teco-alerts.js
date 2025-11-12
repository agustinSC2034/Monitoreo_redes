/**
 * Script para eliminar alertas de WAN-TECO (warnings)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function deleteWanTecoAlerts() {
  console.log('🔍 Buscando alertas de WAN-TECO...\n');

  // Buscar alertas de WAN-TECO
  const { data: alerts, error } = await supabase
    .from('alert_history')
    .select('id, sensor_name, status, message, timestamp')
    .ilike('sensor_name', '%WAN-TECO%')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('❌ Error al buscar alertas:', error);
    return;
  }

  console.log(`📊 Alertas de WAN-TECO encontradas: ${alerts.length}\n`);
  
  if (alerts.length === 0) {
    console.log('✅ No hay alertas de WAN-TECO para eliminar');
    return;
  }

  // Mostrar las alertas encontradas
  alerts.forEach((alert, index) => {
    const date = alert.timestamp 
      ? new Date(alert.timestamp * 1000).toLocaleString('es-AR')
      : 'N/A';
    console.log(`${index + 1}. ID: ${alert.id} | ${alert.sensor_name} | Estado: ${alert.status} | Fecha: ${date}`);
  });

  console.log('\n🗑️  Eliminando alertas de WAN-TECO...');

  // Eliminar las alertas
  const { error: deleteError } = await supabase
    .from('alert_history')
    .delete()
    .ilike('sensor_name', '%WAN-TECO%');

  if (deleteError) {
    console.error('❌ Error al eliminar:', deleteError);
    return;
  }

  console.log(`✅ ${alerts.length} alertas eliminadas exitosamente\n`);

  // Verificar conteo total restante
  const { count } = await supabase
    .from('alert_history')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de alertas restantes en historial: ${count}`);
}

deleteWanTecoAlerts().catch(console.error);
