/**
 * 🤖 Script de Monitoreo Automático para GitHub Actions
 * 
 * Este script es ejecutado por GitHub Actions cada 5 minutos.
 * No depende de Vercel ni de que alguien tenga la página abierta.
 * 
 * Flujo:
 * 1. Consulta sensores PRTG
 * 2. Procesa cada sensor con la lógica de alertas
 * 3. Si hay problemas → envía alertas y guarda en Supabase
 * 4. Retorna resultado del chequeo
 */

// IMPORTANTE: Este script corre en Node.js puro, no en Next.js
// Por eso necesitamos configurar las rutas correctamente

const path = require('path');

// Configurar alias @ para que funcione fuera de Next.js
require('module-alias/register');
require('module-alias').addAlias('@', path.join(__dirname, '..', 'src'));

// Ahora sí, importar nuestros módulos
const prtgClient = require('../src/lib/prtgClient').default;
const { processSensorData } = require('../src/lib/alertMonitor');

// Sensores a monitorear
const SENSOR_IDS = [
  '13682', // CABASE
  '13684', // IPLANxARSAT
  '13683', // TECO
  '2137',  // ITTEL-RDA-1-TDL
  '13673'  // ITTEL-RDB-1-TDL
];

async function main() {
  console.log('🤖 [CRON] Iniciando monitoreo automático...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
  console.log(`🎯 Sensores a revisar: ${SENSOR_IDS.length}`);
  console.log('---');
  
  const results = [];
  let errorsCount = 0;
  let alertsTriggered = 0;
  
  for (const sensorId of SENSOR_IDS) {
    try {
      console.log(`🔍 Consultando sensor ${sensorId}...`);
      
      // Obtener datos del sensor desde PRTG
      const sensor = await prtgClient.getSensor(parseInt(sensorId));
      
      console.log(`   ├─ Nombre: ${sensor.name}`);
      console.log(`   ├─ Estado: ${sensor.status}`);
      console.log(`   └─ Valor: ${sensor.lastvalue}`);
      
      // Procesar el sensor (esto ejecuta la lógica de alertas)
      const alertResult = await processSensorData(sensor);
      
      if (alertResult && alertResult.alertTriggered) {
        alertsTriggered++;
        console.log(`   🚨 ¡Alerta disparada para ${sensor.name}!`);
      }
      
      results.push({
        sensor_id: sensorId,
        name: sensor.name,
        status: sensor.status,
        value: sensor.lastvalue,
        checked: true,
        alert_triggered: alertResult?.alertTriggered || false
      });
      
    } catch (error) {
      errorsCount++;
      console.error(`   ❌ Error con sensor ${sensorId}:`, error.message);
      
      results.push({
        sensor_id: sensorId,
        checked: false,
        error: error.message
      });
    }
  }
  
  console.log('---');
  console.log('📊 Resumen del chequeo:');
  console.log(`   ✅ Sensores revisados: ${results.filter(r => r.checked).length}/${SENSOR_IDS.length}`);
  console.log(`   🚨 Alertas disparadas: ${alertsTriggered}`);
  console.log(`   ❌ Errores: ${errorsCount}`);
  console.log(`   ⏰ Finalizado: ${new Date().toLocaleString('es-AR')}`);
  
  // Si hubo errores, salir con código de error para que GitHub Actions lo registre
  if (errorsCount > 0) {
    console.warn('⚠️ Hubo errores durante el chequeo');
    process.exit(1);
  }
  
  console.log('✅ Monitoreo completado exitosamente');
  process.exit(0);
}

// Ejecutar
main().catch(error => {
  console.error('💥 Error fatal en el monitoreo:', error);
  process.exit(1);
});
