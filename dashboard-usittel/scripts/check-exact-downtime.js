/**
 * 🔍 Investigar horario EXACTO de caída de VLAN500-iBGP
 * Comparar: timestamp de alerta vs timestamp del sensor vs gráfico
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

async function investigateExactTime() {
  console.log('🔍 Investigando horario EXACTO de caída de VLAN500-iBGP (sensor 4642)...\n');
  
  // 1. Buscar en sensor_history (datos guardados cada vez que se consulta)
  const { data: history, error: historyError } = await supabase
    .from('sensor_history')
    .select('*')
    .eq('sensor_id', '4642')
    .order('timestamp', { ascending: false })
    .limit(50);
  
  if (historyError) {
    console.error('❌ Error:', historyError);
    return;
  }
  
  console.log('📊 Últimos 50 registros del sensor en sensor_history:\n');
  
  if (history && history.length > 0) {
    // Agrupar por estado
    const byStatus = {};
    history.forEach(record => {
      const time = new Date(record.timestamp * 1000).toLocaleString('es-AR');
      const status = record.status;
      
      if (!byStatus[status]) {
        byStatus[status] = [];
      }
      byStatus[status].push({ time, timestamp: record.timestamp, status_raw: record.status_raw });
    });
    
    console.log('📈 Resumen por estado:');
    Object.keys(byStatus).forEach(status => {
      console.log(`\n${status} (${byStatus[status].length} registros):`);
      console.log('  Primer registro:', byStatus[status][byStatus[status].length - 1].time);
      console.log('  Último registro:', byStatus[status][0].time);
    });
    
    // Encontrar el CAMBIO de estado (UP → DOWN)
    console.log('\n\n🔍 Buscando CAMBIO de estado (último UP antes del DOWN):\n');
    
    let foundChange = false;
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const previous = history[i + 1];
      
      if (current.status === 'Falla' && previous.status !== 'Falla') {
        console.log('━━━ CAMBIO DETECTADO ━━━');
        console.log(`⬆️ ANTES (UP): ${new Date(previous.timestamp * 1000).toLocaleString('es-AR')}`);
        console.log(`   Status: ${previous.status} (status_raw: ${previous.status_raw})`);
        console.log(`   Timestamp UNIX: ${previous.timestamp}`);
        console.log('');
        console.log(`⬇️ DESPUÉS (DOWN): ${new Date(current.timestamp * 1000).toLocaleString('es-AR')}`);
        console.log(`   Status: ${current.status} (status_raw: ${current.status_raw})`);
        console.log(`   Timestamp UNIX: ${current.timestamp}`);
        console.log('');
        console.log(`⏱️ INTERVALO: ${current.timestamp - previous.timestamp} segundos (~${Math.round((current.timestamp - previous.timestamp) / 60)} minutos)`);
        foundChange = true;
        break;
      }
    }
    
    if (!foundChange) {
      console.log('⚠️ No se encontró cambio de estado en los últimos 50 registros');
      console.log('   El sensor estuvo en estado Falla durante todo el período registrado');
    }
  }
  
  // 2. Buscar en status_changes (debería tener el cambio exacto)
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: changes, error: changesError } = await supabase
    .from('status_changes')
    .select('*')
    .eq('sensor_id', '4642')
    .order('timestamp', { ascending: false })
    .limit(10);
  
  if (changesError) {
    console.error('❌ Error:', changesError);
    return;
  }
  
  console.log('🔄 Últimos cambios de estado registrados en status_changes:\n');
  
  if (changes && changes.length > 0) {
    changes.forEach((change, idx) => {
      console.log(`━━━ Cambio #${idx + 1} ━━━`);
      console.log(`⏰ ${new Date(change.timestamp * 1000).toLocaleString('es-AR')}`);
      console.log(`📊 ${change.old_status} (${change.old_status_raw}) → ${change.new_status} (${change.new_status_raw})`);
      console.log(`🆔 Sensor: ${change.sensor_id} - ${change.sensor_name}`);
      console.log('');
    });
  } else {
    console.log('⚠️ No hay cambios de estado registrados en status_changes');
    console.log('   Esto puede indicar que el sensor cayó ANTES de implementar el sistema de tracking');
  }
  
  // 3. Ver la alerta enviada
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: alerts, error: alertsError } = await supabase
    .from('alert_history')
    .select('*')
    .eq('sensor_id', '4642')
    .order('timestamp', { ascending: false })
    .limit(5);
  
  if (alertsError) {
    console.error('❌ Error:', alertsError);
    return;
  }
  
  console.log('📧 Últimas alertas enviadas:\n');
  
  if (alerts && alerts.length > 0) {
    alerts.forEach((alert, idx) => {
      console.log(`━━━ Alerta #${idx + 1} ━━━`);
      console.log(`⏰ ${new Date(alert.timestamp * 1000).toLocaleString('es-AR')}`);
      console.log(`📊 Estado: ${alert.status}`);
      console.log(`✅ Éxito: ${alert.success}`);
      console.log('');
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 CONCLUSIÓN:');
  console.log('   - Si status_changes está vacío, el sensor cayó ANTES del deploy actual');
  console.log('   - Si hay cambio en sensor_history, ese es el momento aproximado');
  console.log('   - La alerta se envía cuando GitHub Actions detecta el cambio');
  console.log('   - El gráfico puede mostrar datos más antiguos (cache de PRTG)');
}

investigateExactTime().catch(console.error);
