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
  getLastAlertForRule,
  getLastStatusChange,
  type SensorHistory,
  type StatusChange,
  type AlertRule
} from './db';
import { sendAlertEmail } from './emailService';
import { sendWhatsAppAlert } from './whatsappService';
import { sendTelegramAlert } from './telegramService';

// Mapa para trackear último estado conocido de cada sensor
const lastKnownStates = new Map<string, {
  status: string;
  status_raw: number;
  timestamp: number;
  trafficValue?: number; // Valor de tráfico en Mbit/s
}>();

// Mapa para trackear últimas alertas enviadas (cooldown por regla)
const lastAlertTimes = new Map<string, number>();

// 🆕 Mapa para trackear el último estado por el cual se alertó (evitar alertas repetidas del mismo estado)
const lastAlertedStates = new Map<string, string>(); // key: "ruleId_sensorId", value: "status"

// 🆕 Mapa para trackear últimos checks de historial (evitar duplicados)
const lastHistoryChecks = new Map<string, number>();

// 🆕 Mapa para cooldown GLOBAL de WhatsApp por sensor (evitar spam de múltiples reglas)
const lastWhatsAppBySensor = new Map<string, number>();
const WHATSAPP_GLOBAL_COOLDOWN = 120; // 2 minutos entre notificaciones WhatsApp del mismo sensor

/**
 * 🚨 Revisar historial PRTG para detectar bajones intermedios
 * 
 * Esta función consulta el historial de PRTG de los últimos 5 minutos
 * para detectar eventos DOWN/WARNING que pudieron ocurrir entre polling.
 * DETECTA CAÍDAS REALES revisando si el tráfico cayó a 0 o valores muy bajos.
 */
async function checkHistoricalDowntime(sensor: SensorHistory) {
  const sensorId = sensor.sensor_id;
  
  // Evitar consultar historial muy seguido (máximo cada 30 segundos)
  const lastCheck = lastHistoryChecks.get(sensorId);
  const now = Math.floor(Date.now() / 1000);
  
  if (lastCheck && (now - lastCheck) < 30) {
    return; // Muy reciente, skip
  }
  
  lastHistoryChecks.set(sensorId, now);
  
  try {
    // Importar prtgClient dinámicamente para evitar dependencia circular
    const { default: prtgClient } = await import('./prtgClient');
    
    // Consultar últimos 5 minutos de historial (ventana más amplia para detectar caídas)
    const events = await prtgClient.detectRecentDowntime(parseInt(sensorId), 5);
    
    if (events.length === 0) {
      return; // No hay eventos, todo bien
    }
    
    // Procesar eventos encontrados
    for (const event of events) {
      // Si el evento es reciente (últimos 2 minutos) y es DOWN/WARNING
      if (event.status_raw === 5 || event.status_raw === 4) {
        console.log(`🚨 [HISTORY] Bajón detectado en historial: ${sensor.sensor_name} - ${event.status}`);
        
        // Crear datos de sensor con el estado histórico
        const historicalSensor: SensorHistory = {
          ...sensor,
          status: event.status,
          status_raw: event.status_raw,
          timestamp: event.timestamp
        };
        
        // Guardar el evento histórico
        await saveSensorHistory(historicalSensor);
        
        // Crear cambio de estado
        const change: StatusChange = {
          sensor_id: sensor.sensor_id,
          sensor_name: sensor.sensor_name,
          old_status: 'Up',
          new_status: event.status,
          duration: now - event.timestamp, // Duración aproximada
          timestamp: event.timestamp
        };
        
        await saveStatusChange(change);
        
        // Verificar si hay que disparar alertas
        await checkAndTriggerAlerts(historicalSensor, change);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al revisar historial:', error);
  }
}

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
    await saveSensorHistory(historyData);
    
    // 🚨 NUEVO: Revisar historial PRTG para detectar bajones intermedios
    await checkHistoricalDowntime(historyData);
    
    // Detectar cambio de estado
    await detectStatusChange(historyData);
    
    // Log del sistema
    await saveSystemLog({
      level: 'debug',
      category: 'sensor_monitor',
      message: `Sensor ${historyData.sensor_name} procesado: ${historyData.status}`,
      timestamp
    });
    
  } catch (error) {
    console.error('❌ Error al procesar sensor:', error);
    await saveSystemLog({
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
  const currentTraffic = parseTrafficValue(current.lastvalue || '');
  
  // Si no hay estado previo, guardarlo y salir
  if (!lastKnown) {
    lastKnownStates.set(sensorId, {
      status: current.status,
      status_raw: current.status_raw,
      timestamp: current.timestamp,
      trafficValue: currentTraffic || undefined
    });
    
    // Aunque no haya cambio, evaluar reglas de umbral
    await checkThresholdAlerts(current);
    return;
  }
  
  // Verificar cambio drástico de tráfico
  if (currentTraffic && lastKnown.trafficValue) {
    await detectTrafficChange(current, currentTraffic, lastKnown.trafficValue);
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
    
    await saveStatusChange(change);
    
    console.log(`🔄 Cambio de estado detectado: ${current.sensor_name} | ${lastKnown.status} → ${current.status}`);
    
    // Log del sistema
    await saveSystemLog({
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
      timestamp: current.timestamp,
      trafficValue: currentTraffic || undefined
    });
    
    // 🆕 Si el sensor volvió a estado normal (UP), disparar alerta de recuperación
    if (current.status_raw === 3 && lastKnown.status_raw !== 3) { // Recuperación: X → UP
      console.log(`✅ Sensor recuperado: ${current.sensor_name}`);
      await checkRecoveryAlerts(current, change);
      
      // Limpiar los estados alertados para que pueda alertar nuevamente si vuelve a fallar
      const rules = await getAlertRuleBySensor(sensorId);
      for (const rule of rules) {
        const stateKey = `${rule.id}_${sensorId}`;
        lastAlertedStates.delete(stateKey);
      }
    }
    
    // Verificar si hay que disparar alertas por cambio de estado
    await checkAndTriggerAlerts(current, change);
  } else {
    // No hubo cambio de estado, pero actualizar tráfico
    lastKnownStates.set(sensorId, {
      status: current.status,
      status_raw: current.status_raw,
      timestamp: current.timestamp,
      trafficValue: currentTraffic || undefined
    });
    
    // 🆕 Verificar si hubo recuperación consultando la BD (en caso de reinicio)
    if (current.status_raw === 3) {
      const lastChange = await getLastStatusChange(sensorId);
      
      // Si el último cambio registrado fue a un estado no-UP, es una recuperación
      if (lastChange && !lastChange.new_status.toLowerCase().includes('up') && 
          !lastChange.new_status.toLowerCase().includes('disponible')) {
        
        console.log(`✅ [BD] Recuperación detectada: ${current.sensor_name} (${lastChange.new_status} → UP)`);
        
        const recoveryChange: StatusChange = {
          sensor_id: current.sensor_id,
          sensor_name: current.sensor_name,
          old_status: lastChange.new_status,
          new_status: current.status,
          timestamp: current.timestamp
        };
        
        await checkRecoveryAlerts(current, recoveryChange);
        
        // Guardar el cambio de estado para no alertar de nuevo
        await saveStatusChange(recoveryChange);
        
        // Limpiar los estados alertados
        const rules = await getAlertRuleBySensor(sensorId);
        for (const rule of rules) {
          const stateKey = `${rule.id}_${sensorId}`;
          lastAlertedStates.delete(stateKey);
        }
      }
    }
    
    // Evaluar reglas de umbral
    await checkThresholdAlerts(current);
  }
}

/**
 * 📊 Detectar cambios drásticos de tráfico
 */
async function detectTrafficChange(
  sensor: SensorHistory, 
  currentTraffic: number, 
  previousTraffic: number
) {
  const change = ((currentTraffic - previousTraffic) / previousTraffic) * 100;
  const absChange = Math.abs(change);
  
  // Ignorar cambios drásticos si el tráfico actual es muy bajo (< 10 Mbit/s)
  // Esto evita alertas falsas en sensores con tráfico casi nulo
  if (currentTraffic < 10) {
    return;
  }
  
  // Si el cambio es mayor al 50%, es significativo
  if (absChange > 50) {
    const changeType = change > 0 ? 'AUMENTO' : 'CAÍDA';
    console.log(`📊 Cambio drástico de tráfico en ${sensor.sensor_name}: ${changeType} de ${absChange.toFixed(1)}%`);
    console.log(`   Anterior: ${previousTraffic.toFixed(0)} Mbit/s → Actual: ${currentTraffic.toFixed(0)} Mbit/s`);
    
    // Log del sistema
    await saveSystemLog({
      level: 'warn',
      category: 'traffic_change',
      message: `${sensor.sensor_name}: ${changeType} drástico de tráfico (${absChange.toFixed(1)}%)`,
      metadata: {
        sensor_id: sensor.sensor_id,
        previous: previousTraffic,
        current: currentTraffic,
        change_percent: change
      },
      timestamp: sensor.timestamp
    });
    
    // Verificar si hay reglas para este tipo de cambio
    const rules = await getAlertRuleBySensor(sensor.sensor_id);
    for (const rule of rules) {
      // ⏸️ ALERTAS DE TRÁFICO DESACTIVADAS TEMPORALMENTE
      // Mantener lógica pero no disparar alertas hasta confirmar umbrales
      if (
        (change > 0 && rule.condition === 'traffic_spike' && absChange > (rule.threshold || 50)) ||
        (change < 0 && rule.condition === 'traffic_drop' && absChange > (rule.threshold || 50))
      ) {
        console.log(`⏸️ [DESACTIVADO] Alerta de cambio de tráfico: ${rule.name} (${absChange.toFixed(1)}%)`);
        continue; // Skip - alertas de tráfico desactivadas
        
        // TODO: Reactivar cuando se confirmen capacidades reales de enlaces
        /*
        // Verificar cooldown
        const cooldownKey = `${rule.id}_${sensor.sensor_id}`;
        const lastAlertTime = lastAlertTimes.get(cooldownKey);
        const now = Math.floor(Date.now() / 1000);
        
        if (!lastAlertTime || (now - lastAlertTime) >= rule.cooldown) {
          console.log(`🚨 Disparando alerta de cambio de tráfico: ${rule.name}`);
          
          // Crear cambio ficticio con información de tráfico
          const trafficChange: StatusChange = {
            sensor_id: sensor.sensor_id,
            sensor_name: sensor.sensor_name,
            old_status: `${previousTraffic.toFixed(0)} Mbit/s`,
            new_status: `${currentTraffic.toFixed(0)} Mbit/s (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`,
            timestamp: sensor.timestamp
          };
          
          await triggerAlert(rule, sensor, trafficChange);
          lastAlertTimes.set(cooldownKey, now);
        }
        */
      }
    }
  }
}

/**
 * 🎯 Verificar alertas de umbral (sin cambio de estado)
 */
async function checkThresholdAlerts(sensor: SensorHistory) {
  const rules = await getAlertRuleBySensor(sensor.sensor_id);
  
  if (!rules || rules.length === 0) {
    return;
  }
  
  // Crear un cambio "ficticio" para la evaluación de umbral
  const dummyChange: StatusChange = {
    sensor_id: sensor.sensor_id,
    sensor_name: sensor.sensor_name,
    old_status: sensor.status,
    new_status: sensor.status,
    timestamp: sensor.timestamp
  };
  
  for (const rule of rules) {
    // Evaluar reglas de tipo 'slow', 'down' (Warning desactivado globalmente)
    // Nota: traffic_spike y traffic_drop se manejan en detectTrafficChange
    if (!['slow', 'down'].includes(rule.condition)) continue;
    
    // Skip si la regla no tiene ID (no debería pasar)
    if (!rule.id) continue;
    
    // 🆕 Verificar si el estado cambió desde la última alerta (SOLO PARA REGLAS DOWN)
    // Las reglas 'slow' (umbral de tráfico) no deben bloquearse por estado, solo por cooldown
    if (rule.condition === 'down') {
      const stateKey = `${rule.id}_${sensor.sensor_id}`;
      const lastAlertedStatus = lastAlertedStates.get(stateKey);
      
      // Si ya lo tenemos en memoria y es el mismo estado, skip
      if (lastAlertedStatus === sensor.status) {
        continue;
      }
      
      // 🆕 Si no está en memoria, consultar la BD
      if (!lastAlertedStatus) {
        const lastAlert = await getLastAlertForRule(rule.id, sensor.sensor_id);
        if (lastAlert && lastAlert.status === sensor.status) {
          // Guardar en memoria para próximas verificaciones
          lastAlertedStates.set(stateKey, sensor.status);
          continue;
        }
      }
    }
    
    // Verificar cooldown
    const cooldownKey = `${rule.id}_${sensor.sensor_id}`;
    const lastAlertTime = lastAlertTimes.get(cooldownKey);
    const now = Math.floor(Date.now() / 1000);
    
    const shouldCheckCooldown = rule.cooldown > 0;
    
    if (shouldCheckCooldown && lastAlertTime && (now - lastAlertTime) < rule.cooldown) {
      console.log(`⏳ Cooldown activo para regla "${rule.name}"`);
      continue;
    }
    
    if (!shouldCheckCooldown) {
      console.log(`🧪 [TEST] Regla "${rule.name}" con cooldown=0, se evaluará siempre`);
    }
    
    // Verificar condición
    const shouldTrigger = evaluateAlertCondition(rule, sensor, dummyChange);
    
    if (shouldTrigger) {
      console.log(`🚨 Condición detectada: ${rule.name} (estado: ${sensor.status})`);
      await triggerAlert(rule, sensor, dummyChange);
      
      // 🧪 Solo guardar en lastAlertTimes si hay cooldown > 0
      if (rule.cooldown > 0) {
        lastAlertTimes.set(cooldownKey, now);
      }
      
      // 🆕 Guardar el estado por el cual se alertó (SOLO PARA REGLAS DOWN)
      if (rule.condition === 'down') {
        const stateKey = `${rule.id}_${sensor.sensor_id}`;
        lastAlertedStates.set(stateKey, sensor.status);
      }
    }
  }
}

/**
 * ✅ Verificar y disparar alertas de recuperación
 */
async function checkRecoveryAlerts(sensor: SensorHistory, change: StatusChange) {
  // Obtener reglas de alerta para este sensor
  const rules = await getAlertRuleBySensor(sensor.sensor_id);
  
  if (!rules || rules.length === 0) {
    return;
  }
  
  // 🔴 FILTRO GLOBAL: No alertar recuperaciones desde WARNING
  // Solo alertar recuperaciones desde DOWN real (caída completa)
  const isFromWarning = change.old_status.toLowerCase().includes('warning') ||
                        change.old_status.toLowerCase().includes('advertencia');
  
  if (isFromWarning) {
    console.log(`⏸️ [${sensor.sensor_id}] Omitiendo alerta de recuperación desde Warning (solo DOWN→UP)`);
    return; // Skip alerta de recuperación desde Warning
  }
  
  for (const rule of rules) {
    // Solo disparar para reglas de tipo "down" que ahora se recuperaron
    if (rule.condition !== 'down') continue;
    
    // Verificar cooldown
    const cooldownKey = `${rule.id}_${sensor.sensor_id}`;
    const lastAlertTime = lastAlertTimes.get(cooldownKey);
    const now = Math.floor(Date.now() / 1000);
    
    if (lastAlertTime && (now - lastAlertTime) < rule.cooldown) {
      continue;
    }
    
    console.log(`✅ Disparando alerta de recuperación: ${rule.name}`);
    
    // Modificar el change para indicar recuperación
    const recoveryChange: StatusChange = {
      ...change,
      old_status: change.old_status + ' ❌',
      new_status: change.new_status + ' ✅'
    };
    
    await triggerAlert(rule, sensor, recoveryChange, true); // true = es recuperación
    lastAlertTimes.set(cooldownKey, now);
  }
}

/**
 * 🚨 Verificar y disparar alertas
 */
async function checkAndTriggerAlerts(sensor: SensorHistory, change: StatusChange) {
  // Obtener reglas de alerta para este sensor
  const rules = await getAlertRuleBySensor(sensor.sensor_id);
  
  if (!rules || rules.length === 0) {
    return; // No hay reglas configuradas
  }
  
  for (const rule of rules) {
    // Skip si la regla no tiene ID
    if (!rule.id) continue;
    
    // 🆕 Verificar si el estado cambió desde la última alerta (para reglas down solamente)
    // Warning desactivado globalmente
    if (['down'].includes(rule.condition)) {
      const stateKey = `${rule.id}_${sensor.sensor_id}`;
      const lastAlertedStatus = lastAlertedStates.get(stateKey);
      
      // Si ya lo tenemos en memoria y es el mismo estado, skip
      if (lastAlertedStatus === sensor.status) {
        continue;
      }
      
      // 🆕 Si no está en memoria, consultar la BD
      if (!lastAlertedStatus) {
        const lastAlert = await getLastAlertForRule(rule.id, sensor.sensor_id);
        if (lastAlert && lastAlert.status === sensor.status) {
          // Guardar en memoria para próximas verificaciones
          lastAlertedStates.set(stateKey, sensor.status);
          continue;
        }
      }
    }
    
    // Verificar cooldown
    const cooldownKey = `${rule.id}_${sensor.sensor_id}`;
    const lastAlertTime = lastAlertTimes.get(cooldownKey);
    const now = Math.floor(Date.now() / 1000);
    
    // 🧪 BYPASS: Ignorar cooldown si la regla tiene cooldown=0 (para testing)
    const shouldCheckCooldown = rule.cooldown > 0;
    
    if (shouldCheckCooldown && lastAlertTime && (now - lastAlertTime) < rule.cooldown) {
      console.log(`⏳ Cooldown activo para regla "${rule.name}" (${rule.cooldown - (now - lastAlertTime)}s restantes)`);
      continue;
    }
    
    // Log para debugging
    if (!shouldCheckCooldown) {
      console.log(`🧪 [TEST] Regla "${rule.name}" con cooldown=0, se evaluará siempre`);
    }
    
    // Verificar condición
    const shouldTrigger = evaluateAlertCondition(rule, sensor, change);
    
    if (shouldTrigger) {
      console.log(`🚨 Disparando alerta: ${rule.name}`);
      await triggerAlert(rule, sensor, change);
      
      // 🧪 Solo guardar en lastAlertTimes si hay cooldown > 0
      if (rule.cooldown > 0) {
        lastAlertTimes.set(cooldownKey, now);
      }
      
      // 🆕 Guardar el estado por el cual se alertó (para reglas down solamente)
      if (['down'].includes(rule.condition)) {
        const stateKey = `${rule.id}_${sensor.sensor_id}`;
        lastAlertedStates.set(stateKey, sensor.status);
      }
    }
  }
}

/**
 * 🎯 Evaluar si una regla debe dispararse
 */
function evaluateAlertCondition(rule: AlertRule, sensor: SensorHistory, change: StatusChange): boolean {
  switch (rule.condition) {
    case 'down':
      // 🔴 FILTRO GLOBAL: No alertar WARNING (status_raw = 4)
      // Solo alertar cuando el sensor esté realmente DOWN (status_raw = 5)
      const isWarning = sensor.status_raw === 4 || 
                       sensor.status.toLowerCase().includes('warning') ||
                       sensor.status.toLowerCase().includes('advertencia');
      
      if (isWarning) {
        console.log(`⏸️ [${sensor.sensor_id}] Ignorando alerta de WARNING (solo se alerta DOWN)`);
        return false;
      }
      
      // Disparar solo si el sensor está DOWN (no Warning)
      return sensor.status_raw === 5 || sensor.status.toLowerCase().includes('down');
    
    case 'warning':
      // ⏸️ WARNING DESACTIVADO GLOBALMENTE
      // No se envían alertas de Warning para ningún sensor
      return false;
    
    case 'unusual':
      // Disparar en cualquier estado no-UP
      return sensor.status_raw !== 3;
    
    case 'slow':
      // Evaluar umbral de tráfico (máximo)
      if (rule.threshold && sensor.lastvalue) {
        const trafficValue = parseTrafficValue(sensor.lastvalue);
        if (trafficValue !== null) {
          console.log(`📊 Tráfico actual: ${trafficValue} Mbit/s | Umbral: ${rule.threshold} Mbit/s`);
          return trafficValue > rule.threshold;
        }
      }
      return false;
    
    case 'traffic_spike':
      // Detectado en detectTrafficChange()
      return false;
    
    case 'traffic_drop':
      // Detectado en detectTrafficChange()
      return false;
    
    default:
      return false;
  }
}

/**
 * 🔢 Parsear valor de tráfico a Mbit/s
 */
function parseTrafficValue(lastvalue: string): number | null {
  if (!lastvalue) return null;
  
  // Formato típico: "6.221.063 kbit/s" o "5.4 Gbit/s"
  const match = lastvalue.match(/([\d.,]+)\s*(kbit|Mbit|Gbit)/i);
  if (!match) return null;
  
  const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  const unit = match[2].toLowerCase();
  
  // Convertir todo a Mbit/s
  switch (unit) {
    case 'kbit':
      return value / 1000; // kbit/s a Mbit/s
    case 'mbit':
      return value; // Ya está en Mbit/s
    case 'gbit':
      return value * 1000; // Gbit/s a Mbit/s
    default:
      return null;
  }
}

/**
 * 📧 Disparar alerta (enviar notificaciones)
 */
async function triggerAlert(rule: AlertRule, sensor: SensorHistory, change: StatusChange, isRecovery: boolean = false) {
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
            await sendEmailAlert(rule, message, isRecovery);
            channelResults.push({ channel: 'email', success: true });
            break;
          
          case 'whatsapp':
            await sendWhatsAppAlertInternal(rule, sensor, message);
            channelResults.push({ channel: 'whatsapp', success: true });
            break;
          
          case 'telegram':
            const telegramSuccess = await sendTelegramAlert({
              sensorName: sensor.sensor_name,
              status: sensor.status,
              message,
              location: sensor.sensor_id.startsWith('4') || sensor.sensor_id.startsWith('5') || sensor.sensor_id.startsWith('3') || sensor.sensor_id.startsWith('6') 
                ? 'LARANET LA MATANZA' 
                : 'USITTEL TANDIL'
            });
            channelResults.push({ channel: 'telegram', success: telegramSuccess });
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
    await saveAlertHistory({
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
    await saveSystemLog({
      level: channelResults.some(r => r.success) ? 'info' : 'error',
      category: 'alert',
      message: `Alerta disparada: ${rule.name} para ${sensor.sensor_name}`,
      metadata: { rule, sensor, channelResults },
      timestamp
    });
    
  } catch (error) {
    console.error('❌ Error disparando alerta:', error);
    await saveSystemLog({
      level: 'error',
      category: 'alert',
      message: `Error disparando alerta: ${rule.name}`,
      metadata: { error: String(error) },
      timestamp
    });
  }
}

/**
 * 📝 Formatear mensaje de alerta (Minimalista)
 */
function formatAlertMessage(rule: AlertRule, sensor: SensorHistory, change: StatusChange): string {
  // sensor.timestamp es Unix timestamp en UTC (segundos)
  // Convertir directamente usando la timezone de Argentina
  const timestamp = new Date(sensor.timestamp * 1000).toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Formato 24 horas para evitar confusión AM/PM
    timeZone: 'America/Argentina/Buenos_Aires'
  });
  
  // Determinar ubicación según el sensor
  const location = sensor.sensor_name.includes('(063)') || sensor.sensor_name.includes('CABASE') || 
                   sensor.sensor_name.includes('IPLAN') || sensor.sensor_name.includes('TECO') ||
                   sensor.sensor_name.includes('RDA') || sensor.sensor_name.includes('DTV')
    ? '🔵 USITTEL TANDIL'
    : '🟢 LARANET LA MATANZA';
  
  let message = `${location}\n\n`;
  message += `SENSOR: ${sensor.sensor_name}\n`;
  
  if (rule.condition === 'slow' && rule.threshold) {
    // Alerta de umbral
    message += `CONDICIÓN: Tráfico > ${rule.threshold} Mbit/s\n`;
    message += `VALOR ACTUAL: ${sensor.lastvalue || 'N/A'}\n`;
  } else if (rule.condition === 'traffic_spike' || rule.condition === 'traffic_drop') {
    // Alerta de cambio drástico
    const changeType = rule.condition === 'traffic_spike' ? 'AUMENTO DRÁSTICO' : 'CAÍDA DRÁSTICA';
    message += `CONDICIÓN: ${changeType} de tráfico\n`;
    message += `ANTERIOR: ${change.old_status}\n`;
    message += `ACTUAL: ${change.new_status}\n`;
  } else {
    // Alerta de cambio de estado (DOWN, WARNING, etc)
    message += `CONDICIÓN: Cambio de estado\n`;
    message += `ESTADO: ${change.old_status} → ${sensor.status}\n`;
    if (change.duration) {
      const minutes = Math.floor(change.duration / 60);
      message += `DURACIÓN ANTERIOR: ${minutes} min\n`;
    }
  }
  
  message += `TIMESTAMP: ${timestamp}\n`;
  
  // ❌ Eliminado: No mostrar detalles técnicos de PRTG
  // if (sensor.message && !sensor.message.includes('<div')) {
  //   message += `\nDETALLES:\n${sensor.message}`;
  // }
  
  return message;
}

/**
 * 📧 Enviar alerta por email (REAL)
 */
async function sendEmailAlert(rule: AlertRule, message: string, isRecovery: boolean = false) {
  const { sendAlertEmail } = await import('./emailService');
  
  const emailRecipients = rule.recipients.filter(r => r.includes('@'));
  
  if (emailRecipients.length === 0) {
    console.warn('⚠️ No hay destinatarios de email válidos en la regla');
    return;
  }
  
  console.log(`📧 [EMAIL] Enviando alerta a:`, emailRecipients);
  
  // Cambiar asunto si es recuperación
  const subject = isRecovery 
    ? `Alerta: ${rule.name.replace('Enlace Caído', 'Enlace Recuperado')}`
    : `Alerta: ${rule.name}`;
  
  const success = await sendAlertEmail(emailRecipients, subject, message, rule.priority);
  
  if (success) {
    console.log('✅ Email enviado exitosamente');
  } else {
    console.error('❌ Error al enviar email');
    throw new Error('Failed to send email');
  }
}

/**
 * 📱 Enviar alerta por WhatsApp usando Twilio
 */
async function sendWhatsAppAlertInternal(rule: AlertRule, sensor: SensorHistory, message: string) {
  try {
    // Filtrar solo destinatarios de WhatsApp (empiezan con +)
    const whatsappRecipients = rule.recipients.filter(r => r.startsWith('+'));
    
    if (whatsappRecipients.length === 0) {
      console.log('⚠️ No hay destinatarios de WhatsApp configurados');
      return;
    }
    
    // 🛡️ COOLDOWN GLOBAL: Evitar spam de múltiples reglas del mismo sensor
    const sensorId = sensor.sensor_id;
    const now = Math.floor(Date.now() / 1000);
    const lastWhatsApp = lastWhatsAppBySensor.get(sensorId);
    
    if (lastWhatsApp && (now - lastWhatsApp) < WHATSAPP_GLOBAL_COOLDOWN) {
      const remaining = WHATSAPP_GLOBAL_COOLDOWN - (now - lastWhatsApp);
      console.log(`⏳ [WHATSAPP] Cooldown global activo para sensor ${sensorId} (${remaining}s restantes)`);
      return; // Skip WhatsApp pero permitir email
    }
    
    // Actualizar timestamp de último WhatsApp enviado
    lastWhatsAppBySensor.set(sensorId, now);
    
    console.log(`📱 [WHATSAPP] Enviando alerta a:`, whatsappRecipients);
    
    // Usar el servicio de WhatsApp
    const result = await sendWhatsAppAlert(
      whatsappRecipients,
      rule.name,
      message,
      rule.priority.toUpperCase()
    );
    
    if (result.success) {
      console.log(`✅ WhatsApp enviado: ${result.sent} exitosos`);
    } else {
      console.error(`❌ Error enviando WhatsApp:`, result.errors);
    }
  } catch (error) {
    console.error('❌ Error en sendWhatsAppAlertInternal:', error);
  }
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
  
  // Limpiar cooldowns globales de WhatsApp
  for (const [sensorId, timestamp] of lastWhatsAppBySensor.entries()) {
    if (timestamp < threshold) {
      lastWhatsAppBySensor.delete(sensorId);
    }
  }
}

export default {
  processSensorData,
  cleanupOldStates
};
