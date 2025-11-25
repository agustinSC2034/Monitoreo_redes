/**
 * ⏸️ Monitor de Sensores Pausados
 * 
 * Detecta cuando sensores críticos están pausados en PRTG
 * y no es posible monitorear su estado real
 */

export interface PausedSensorStatus {
  sensorId: string;
  sensorName: string;
  isPaused: boolean;
  lastCheckTime: number;
  lastAlertTime: number;
}

// Sensores críticos a monitorear (solo enlaces mayoristas de USITTEL)
const CRITICAL_SENSORS_TANDIL = ['13682', '13684', '13683']; // CABASE, IPLAN, TECO

// Estado en memoria
const pausedStatus = new Map<string, PausedSensorStatus>();

// Configuración
const ALERT_ENABLED = false; // Por ahora solo logging, NO alertas
const ALERT_RECIPIENTS = [
  'agustin.scutari@it-tel.com.ar',
  'ja@it-tel.com.ar',
  'md@it-tel.com.ar'
];

/**
 * 📊 Verificar si un sensor está pausado y loguear
 */
export async function checkPausedSensor(
  sensorId: string,
  sensorName: string,
  status: string,
  location: string
): Promise<void> {
  // Solo monitorear sensores críticos de Tandil
  if (location !== 'tandil' || !CRITICAL_SENSORS_TANDIL.includes(sensorId)) {
    return;
  }

  const isPaused = status === 'Pausado' || status === 'Paused';
  const now = Math.floor(Date.now() / 1000);
  
  const currentStatus = pausedStatus.get(sensorId) || {
    sensorId,
    sensorName,
    isPaused: false,
    lastCheckTime: 0,
    lastAlertTime: 0
  };

  if (isPaused && !currentStatus.isPaused) {
    // Sensor recién detectado como pausado
    console.log(`⏸️ [PAUSED-MONITOR] Sensor crítico PAUSADO detectado:`);
    console.log(`   - Sensor: ${sensorName} (${sensorId})`);
    console.log(`   - Estado: ${status}`);
    console.log(`   - Tiempo: ${new Date().toLocaleString('es-AR')}`);
    console.log(`   - ⚠️ No es posible monitorear el estado del enlace mientras esté pausado`);
    
    // TODO: Aquí se podría disparar alerta cuando ALERT_ENABLED = true
    // await triggerPausedSensorAlert(sensorId, sensorName);
    
    pausedStatus.set(sensorId, {
      ...currentStatus,
      isPaused: true,
      lastCheckTime: now,
      lastAlertTime: now
    });
  } else if (!isPaused && currentStatus.isPaused) {
    // Sensor se reactivó
    console.log(`✅ [PAUSED-MONITOR] Sensor reactivado:`);
    console.log(`   - Sensor: ${sensorName} (${sensorId})`);
    console.log(`   - Nuevo estado: ${status}`);
    console.log(`   - Monitoreo normal restablecido`);
    
    pausedStatus.set(sensorId, {
      ...currentStatus,
      isPaused: false,
      lastCheckTime: now
    });
  } else if (isPaused) {
    // Sigue pausado
    const timeSinceLast = now - currentStatus.lastCheckTime;
    const minutesPaused = Math.floor(timeSinceLast / 60);
    
    console.log(`⏸️ [PAUSED-MONITOR] Sensor sigue pausado: ${sensorName} (${minutesPaused} min)`);
    
    pausedStatus.set(sensorId, {
      ...currentStatus,
      lastCheckTime: now
    });
  } else {
    // Sensor activo, actualizar timestamp
    pausedStatus.set(sensorId, {
      ...currentStatus,
      isPaused: false,
      lastCheckTime: now
    });
  }
}

/**
 * 📊 Obtener estadísticas de sensores pausados
 */
export function getPausedSensorsStats(): Record<string, any> {
  const stats: Record<string, any> = {};
  
  for (const [sensorId, status] of pausedStatus.entries()) {
    if (status.isPaused) {
      stats[sensorId] = {
        sensorName: status.sensorName,
        isPaused: status.isPaused,
        lastCheckTime: new Date(status.lastCheckTime * 1000).toISOString(),
        minutesPaused: Math.floor((Date.now() / 1000 - status.lastCheckTime) / 60)
      };
    }
  }
  
  return stats;
}

/**
 * 🔍 Verificar si hay sensores críticos pausados (para endpoints de status)
 */
export function hasCriticalSensorsPaused(): boolean {
  for (const [, status] of pausedStatus.entries()) {
    if (status.isPaused) {
      return true;
    }
  }
  return false;
}

/**
 * 📋 Obtener lista de sensores críticos pausados
 */
export function getPausedCriticalSensors(): Array<{sensorId: string, sensorName: string}> {
  const paused: Array<{sensorId: string, sensorName: string}> = [];
  
  for (const [, status] of pausedStatus.entries()) {
    if (status.isPaused) {
      paused.push({
        sensorId: status.sensorId,
        sensorName: status.sensorName
      });
    }
  }
  
  return paused;
}

// 🚨 Función para disparar alerta (deshabilitada por ahora)
// async function triggerPausedSensorAlert(sensorId: string, sensorName: string): Promise<void> {
//   if (!ALERT_ENABLED) return;
//   
//   const message = `
// ALERTA: Sensor Pausado en PRTG
// 
// SENSOR: ${sensorName}
// ID: ${sensorId}
// ESTADO: Pausado
// 
// ⚠️ No es posible monitorear el estado del enlace mientras el sensor esté pausado en PRTG.
// 
// ACCIÓN REQUERIDA:
// - Verificar por qué el sensor está pausado en PRTG
// - Reactivar el sensor si corresponde
// - Revisar configuración de monitoreo
// 
// Dashboard: https://monitoreo-redes.vercel.app/
// `.trim();
//   
//   console.log(`🚨 [PAUSED-ALERT] Enviando alerta de sensor pausado: ${sensorName}`);
//   
//   // Enviar por email
//   // await sendAlertEmail(ALERT_RECIPIENTS, `Alerta: Sensor ${sensorName} Pausado`, message, 'high');
//   
//   // Enviar por Telegram
//   // await sendTelegramAlert({...});
// }
