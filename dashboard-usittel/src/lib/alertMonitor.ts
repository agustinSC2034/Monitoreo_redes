/**
 * 🔔 Monitor de Sensores y Disparador de Alertas
 * 
 * Este servicio:
 * 1. Guarda el historial de estados en la BD
 * 2. Detecta cambios de estado
 * 3. Dispara alertas cuando corresponde
 * 4. Respeta cooldown para evitar spam
 */

import {
  saveSensorHistory,
  saveStatusChange,
  saveAlertHistory,
  saveSystemLog,
  getAlertRuleBySensor,
  type SensorHistory,
  type StatusChange,
  type AlertRule
} from './db';

// Mapa para trackear último estado conocido de cada sensor
const lastKnownStates = new Map<string, {
  status: string;
  status_raw: number;
  timestamp: number;
}>();

// Mapa para trackear últimas alertas enviadas (cooldown)
const lastAlertTimes = new Map<string, number>();

/**
 * 📊 Procesar estado de sensor y guardar historial
 */
export async function processSensorData(sensor: any) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Preparar datos para historial
  const historyData: SensorHistory = {
    sensor_id: sensor.objid.toString(),
    sensor_name: sensor.sensor || sensor.device || 'Unknown',
    status: sensor.status || 'Unknown',
    status_raw: sensor.status_raw || 0,
    message: sensor.message || '',
    lastvalue: sensor.lastvalue || '',
    timestamp
  };
  
  try {
    // Guardar en historial
    saveSensorHistory(historyData);
    
    // Detectar cambio de estado
    await detectStatusChange(historyData);
    
    // Log del sistema
    saveSystemLog({
      level: 'debug',
      category: 'sensor_monitor',
      message: `Sensor ${historyData.sensor_name} procesado: ${historyData.status}`,
      timestamp
    });
    
  } catch (error) {
    console.error('❌ Error al procesar sensor:', error);
    saveSystemLog({
      level: 'error',
      category: 'sensor_monitor',
      message: `Error procesando sensor ${historyData.sensor_name}`,
      metadata: { error: String(error) },
      timestamp
    });
  }
}

/**
 * 🔍 Detectar cambios de estado
 */
async function detectStatusChange(current: SensorHistory) {
  const sensorId = current.sensor_id;
  const lastKnown = lastKnownStates.get(sensorId);
  
  // Si no hay estado previo, guardarlo y salir
  if (!lastKnown) {
    lastKnownStates.set(sensorId, {
      status: current.status,
      status_raw: current.status_raw,
      timestamp: current.timestamp
    });
    return;
  }
  
  // Verificar si cambió el estado
  if (lastKnown.status_raw !== current.status_raw) {
    const duration = current.timestamp - lastKnown.timestamp;
    
    // Guardar cambio de estado
    const change: StatusChange = {
      sensor_id: current.sensor_id,
      sensor_name: current.sensor_name,
      old_status: lastKnown.status,
      new_status: current.status,
      duration,
      timestamp: current.timestamp
    };
    
    saveStatusChange(change);
    
    console.log(`🔄 Cambio de estado detectado: ${current.sensor_name} | ${lastKnown.status} → ${current.status}`);
    
    // Log del sistema
    saveSystemLog({
      level: 'info',
      category: 'status_change',
      message: `${current.sensor_name}: ${lastKnown.status} → ${current.status} (duración: ${duration}s)`,
      metadata: { change },
      timestamp: current.timestamp
    });
    
    // Actualizar último estado conocido
    lastKnownStates.set(sensorId, {
      status: current.status,
      status_raw: current.status_raw,
      timestamp: current.timestamp
    });
    
    // Verificar si hay que disparar alertas
    await checkAndTriggerAlerts(current, change);
  }
}

/**
 * 🚨 Verificar y disparar alertas
 */
async function checkAndTriggerAlerts(sensor: SensorHistory, change: StatusChange) {
  // Obtener reglas de alerta para este sensor
  const rules = getAlertRuleBySensor(sensor.sensor_id);
  
  if (!rules || rules.length === 0) {
    return; // No hay reglas configuradas
  }
  
  for (const rule of rules) {
    // Verificar cooldown
    const cooldownKey = `${rule.id}_${sensor.sensor_id}`;
    const lastAlertTime = lastAlertTimes.get(cooldownKey);
    const now = Math.floor(Date.now() / 1000);
    
    if (lastAlertTime && (now - lastAlertTime) < rule.cooldown) {
      console.log(`⏳ Cooldown activo para regla "${rule.name}" (${rule.cooldown - (now - lastAlertTime)}s restantes)`);
      continue;
    }
    
    // Verificar condición
    const shouldTrigger = evaluateAlertCondition(rule, sensor, change);
    
    if (shouldTrigger) {
      console.log(`🚨 Disparando alerta: ${rule.name}`);
      await triggerAlert(rule, sensor, change);
      lastAlertTimes.set(cooldownKey, now);
    }
  }
}

/**
 * 🎯 Evaluar si una regla debe dispararse
 */
function evaluateAlertCondition(rule: AlertRule, sensor: SensorHistory, change: StatusChange): boolean {
  switch (rule.condition) {
    case 'down':
      // Disparar si el sensor está DOWN
      return sensor.status_raw === 5 || sensor.status.toLowerCase().includes('down');
    
    case 'warning':
      // Disparar si el sensor está en WARNING
      return sensor.status_raw === 4 || sensor.status.toLowerCase().includes('warning');
    
    case 'unusual':
      // Disparar en cualquier estado no-UP
      return sensor.status_raw !== 3;
    
    case 'slow':
      // TODO: Implementar lógica de velocidad lenta
      // Requiere comparar con threshold de ancho de banda
      return false;
    
    default:
      return false;
  }
}

/**
 * 📧 Disparar alerta (enviar notificaciones)
 */
async function triggerAlert(rule: AlertRule, sensor: SensorHistory, change: StatusChange) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  try {
    // Preparar mensaje de alerta
    const message = formatAlertMessage(rule, sensor, change);
    
    // Enviar por cada canal configurado
    const channelResults: { channel: string; success: boolean; error?: string }[] = [];
    
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'email':
            await sendEmailAlert(rule, message);
            channelResults.push({ channel: 'email', success: true });
            break;
          
          case 'whatsapp':
            await sendWhatsAppAlert(rule, message);
            channelResults.push({ channel: 'whatsapp', success: true });
            break;
          
          default:
            console.warn(`⚠️ Canal desconocido: ${channel}`);
        }
      } catch (error) {
        console.error(`❌ Error enviando alerta por ${channel}:`, error);
        channelResults.push({ 
          channel, 
          success: false, 
          error: String(error) 
        });
      }
    }
    
    // Guardar en historial de alertas
    saveAlertHistory({
      rule_id: rule.id!,
      sensor_id: sensor.sensor_id,
      sensor_name: sensor.sensor_name,
      status: sensor.status,
      message,
      channels_sent: channelResults.filter(r => r.success).map(r => r.channel),
      recipients: rule.recipients,
      success: channelResults.some(r => r.success),
      error_message: channelResults.find(r => !r.success)?.error
    });
    
    // Log del sistema
    saveSystemLog({
      level: channelResults.some(r => r.success) ? 'info' : 'error',
      category: 'alert',
      message: `Alerta disparada: ${rule.name} para ${sensor.sensor_name}`,
      metadata: { rule, sensor, channelResults },
      timestamp
    });
    
  } catch (error) {
    console.error('❌ Error disparando alerta:', error);
    saveSystemLog({
      level: 'error',
      category: 'alert',
      message: `Error disparando alerta: ${rule.name}`,
      metadata: { error: String(error) },
      timestamp
    });
  }
}

/**
 * 📝 Formatear mensaje de alerta
 */
function formatAlertMessage(rule: AlertRule, sensor: SensorHistory, change: StatusChange): string {
  const priorityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  }[rule.priority];
  
  const statusEmoji = sensor.status_raw === 5 ? '❌' : sensor.status_raw === 4 ? '⚠️' : 'ℹ️';
  
  return `${priorityEmoji} ${statusEmoji} ALERTA: ${rule.name}

📡 Sensor: ${sensor.sensor_name}
📊 Estado: ${change.old_status} → ${sensor.status}
⏰ Timestamp: ${new Date(sensor.timestamp * 1000).toLocaleString('es-AR')}
💬 Mensaje: ${sensor.message || 'Sin detalles adicionales'}
📈 Último valor: ${sensor.lastvalue || 'N/A'}

🔔 Prioridad: ${rule.priority.toUpperCase()}
⏱️ Duración estado anterior: ${change.duration ? Math.floor(change.duration / 60) + ' minutos' : 'N/A'}`;
}

/**
 * 📧 Enviar alerta por email (placeholder)
 */
async function sendEmailAlert(rule: AlertRule, message: string) {
  // TODO: Implementar con NodeMailer
  console.log(`📧 [EMAIL] Enviando alerta a:`, rule.recipients.filter(r => r.includes('@')));
  console.log(message);
  
  // Por ahora solo simular
  return Promise.resolve();
}

/**
 * 📱 Enviar alerta por WhatsApp (placeholder)
 */
async function sendWhatsAppAlert(rule: AlertRule, message: string) {
  // TODO: Implementar con Twilio
  console.log(`📱 [WHATSAPP] Enviando alerta a:`, rule.recipients.filter(r => r.startsWith('+')));
  console.log(message);
  
  // Por ahora solo simular
  return Promise.resolve();
}

/**
 * 🧹 Limpiar estados antiguos (llamar periódicamente)
 */
export function cleanupOldStates(maxAgeSeconds: number = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const threshold = now - maxAgeSeconds;
  
  // Limpiar estados antiguos
  for (const [sensorId, state] of lastKnownStates.entries()) {
    if (state.timestamp < threshold) {
      lastKnownStates.delete(sensorId);
    }
  }
  
  // Limpiar cooldowns antiguos
  for (const [key, timestamp] of lastAlertTimes.entries()) {
    if (timestamp < threshold) {
      lastAlertTimes.delete(key);
    }
  }
}

export default {
  processSensorData,
  cleanupOldStates
};
