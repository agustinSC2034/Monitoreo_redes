/**
 * 🏥 Monitor de Salud de Servidores PRTG
 * 
 * Detecta cuando un servidor PRTG está caído o no responde
 * y envía alertas por email y Telegram
 */

import type { PRTGLocation } from './prtgClient';
import { sendAlertEmail } from './emailService';
import { sendTelegramAlert } from './telegramService';

// 🕐 Estado de salud de cada PRTG
interface PRTGHealthStatus {
  isDown: boolean;
  lastCheckTime: number;
  lastAlertTime: number;
  consecutiveFailures: number;
}

// Almacenar estado en memoria (persiste durante la vida del proceso)
const healthStatus = new Map<PRTGLocation, PRTGHealthStatus>();

// Configuración
const RECOVERY_ALERT_ENABLED = true; // Enviar alerta cuando se recupera

// Destinatarios de alertas (mismo que las alertas de sensores)
const ALERT_RECIPIENTS = [
  'agustin.scutari@it-tel.com.ar',
  'ja@it-tel.com.ar',
  'md@it-tel.com.ar'
];

/**
 * 🔍 Obtener estado actual de un PRTG
 */
function getHealthStatus(location: PRTGLocation): PRTGHealthStatus {
  if (!healthStatus.has(location)) {
    healthStatus.set(location, {
      isDown: false,
      lastCheckTime: 0,
      lastAlertTime: 0,
      consecutiveFailures: 0
    });
  }
  return healthStatus.get(location)!;
}

/**
 * 📝 Actualizar estado de salud
 */
function updateHealthStatus(location: PRTGLocation, updates: Partial<PRTGHealthStatus>) {
  const current = getHealthStatus(location);
  healthStatus.set(location, { ...current, ...updates });
}

/**
 * 🚨 Registrar fallo de conexión con PRTG
 */
export async function recordPRTGFailure(
  location: PRTGLocation,
  errorMessage: string
): Promise<void> {
  const status = getHealthStatus(location);
  const now = Math.floor(Date.now() / 1000);
  
  console.log(`❌ [PRTG-HEALTH] Fallo de conexión a PRTG ${location.toUpperCase()}: ${errorMessage}`);
  
  updateHealthStatus(location, {
    consecutiveFailures: status.consecutiveFailures + 1,
    lastCheckTime: now
  });
  
  // Solo alertar si NO está ya marcado como caído
  // GitHub Actions se ejecuta cada 5 minutos, así que no necesitamos cooldown adicional
  if (!status.isDown) {
    console.log(`🚨 [PRTG-HEALTH] Primera detección de fallo, enviando alerta...`);
    await triggerPRTGDownAlert(location, errorMessage);
    updateHealthStatus(location, {
      isDown: true,
      lastAlertTime: now
    });
  } else {
    console.log(`⏸️ [PRTG-HEALTH] PRTG ${location.toUpperCase()} sigue caído (no se reenvía alerta)`);
  }
}

/**
 * ✅ Registrar conexión exitosa con PRTG
 */
export async function recordPRTGSuccess(location: PRTGLocation): Promise<void> {
  const status = getHealthStatus(location);
  const now = Math.floor(Date.now() / 1000);
  
  // Si estaba marcado como caído, enviar alerta de recuperación
  if (status.isDown && RECOVERY_ALERT_ENABLED) {
    console.log(`✅ [PRTG-HEALTH] PRTG ${location.toUpperCase()} recuperado`);
    await triggerPRTGRecoveryAlert(location);
  }
  
  // Resetear estado
  updateHealthStatus(location, {
    isDown: false,
    consecutiveFailures: 0,
    lastCheckTime: now
  });
}

/**
 * 🚨 Disparar alerta de PRTG caído
 */
async function triggerPRTGDownAlert(
  location: PRTGLocation,
  errorMessage: string
): Promise<void> {
  const locationName = location === 'tandil' ? 'USITTEL TANDIL' : 'LARANET LA MATANZA';
  const prtgMapUrl = location === 'tandil' 
    ? 'http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5'
    : 'http://stats.reditel.com.ar:8995/public/mapshow.htm?id=3929&mapid=90D14EB2-69FC-4D98-A211-75BDECF55027';
  
  console.log(`🚨 [PRTG-HEALTH] Enviando alerta de PRTG caído: ${locationName}`);
  
  const timestamp = new Date().toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires'
  });
  
  const message = `
${locationName}

TIPO: Servidor PRTG no responde
ESTADO: No se puede conectar
ERROR: ${errorMessage}
FECHA/HORA: ${timestamp}

PRTG: ${prtgMapUrl}
Dashboard: https://monitoreo-redes.vercel.app/
`.trim();

  // Enviar por email
  try {
    await sendAlertEmail(
      ALERT_RECIPIENTS,
      `Alerta: Servidor PRTG ${locationName} No Responde`,
      message,
      'critical'
    );
    console.log(`✅ [PRTG-HEALTH] Email de alerta enviado`);
  } catch (error) {
    console.error(`❌ [PRTG-HEALTH] Error enviando email:`, error);
  }
  
  // Enviar por Telegram
  try {
    await sendTelegramAlert({
      sensorName: `Servidor PRTG ${locationName}`,
      status: 'PRTG No Responde',
      message: message,
      location: locationName,
      sensorId: location === 'tandil' ? 'PRTG-TANDIL' : 'PRTG-MATANZA'
    });
    console.log(`✅ [PRTG-HEALTH] Alerta de Telegram enviada`);
  } catch (error) {
    console.error(`❌ [PRTG-HEALTH] Error enviando Telegram:`, error);
  }
}

/**
 * ✅ Disparar alerta de PRTG recuperado
 */
async function triggerPRTGRecoveryAlert(location: PRTGLocation): Promise<void> {
  const locationName = location === 'tandil' ? 'USITTEL TANDIL' : 'LARANET LA MATANZA';
  const prtgMapUrl = location === 'tandil' 
    ? 'http://38.253.65.250:8080/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5'
    : 'http://stats.reditel.com.ar:8995/public/mapshow.htm?id=3929&mapid=90D14EB2-69FC-4D98-A211-75BDECF55027';
  
  console.log(`✅ [PRTG-HEALTH] Enviando alerta de recuperación: ${locationName}`);
  
  const timestamp = new Date().toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires'
  });
  
  const message = `
${locationName}

TIPO: Servidor PRTG recuperado
ESTADO: Conexión restablecida
FECHA/HORA: ${timestamp}

PRTG: ${prtgMapUrl}
Dashboard: https://monitoreo-redes.vercel.app/
`.trim();

  // Enviar por email
  try {
    await sendAlertEmail(
      ALERT_RECIPIENTS,
      `Alerta: Servidor PRTG ${locationName} Recuperado`,
      message,
      'high'
    );
    console.log(`✅ [PRTG-HEALTH] Email de recuperación enviado`);
  } catch (error) {
    console.error(`❌ [PRTG-HEALTH] Error enviando email de recuperación:`, error);
  }
  
  // Enviar por Telegram
  try {
    await sendTelegramAlert({
      sensorName: `Servidor PRTG ${locationName}`,
      status: 'PRTG Recuperado',
      message: message,
      location: locationName,
      sensorId: location === 'tandil' ? 'PRTG-TANDIL' : 'PRTG-MATANZA'
    });
    console.log(`✅ [PRTG-HEALTH] Alerta de recuperación por Telegram enviada`);
  } catch (error) {
    console.error(`❌ [PRTG-HEALTH] Error enviando Telegram de recuperación:`, error);
  }
}

/**
 * 📊 Obtener estadísticas de salud (para debugging)
 */
export function getPRTGHealthStats(): Record<string, any> {
  const stats: Record<string, any> = {};
  
  for (const [location, status] of healthStatus.entries()) {
    stats[location] = {
      isDown: status.isDown,
      consecutiveFailures: status.consecutiveFailures,
      lastCheckTime: status.lastCheckTime > 0 
        ? new Date(status.lastCheckTime * 1000).toISOString()
        : 'never',
      lastAlertTime: status.lastAlertTime > 0
        ? new Date(status.lastAlertTime * 1000).toISOString()
        : 'never'
    };
  }
  
  return stats;
}
