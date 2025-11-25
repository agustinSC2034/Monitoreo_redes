/**
 * 🏥 Monitor de Salud de Servidores PRTG
 * 
 * Detecta cuando un servidor PRTG está caído o no responde
 * y envía alertas por email y Telegram
 */

import { sendAlertEmail } from './emailService';
import { sendTelegramAlert } from './telegramService';
import type { PRTGLocation } from './prtgClient';

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
const FAILURE_THRESHOLD = 1; // Cuántos fallos consecutivos antes de alertar
const ALERT_COOLDOWN = 1800; // 30 minutos entre alertas del mismo PRTG
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
  
  // Incrementar contador de fallos
  const consecutiveFailures = status.consecutiveFailures + 1;
  
  console.log(`❌ [PRTG-HEALTH] Fallo de conexión a PRTG ${location.toUpperCase()}: ${errorMessage}`);
  console.log(`   Fallos consecutivos: ${consecutiveFailures}/${FAILURE_THRESHOLD}`);
  
  updateHealthStatus(location, {
    consecutiveFailures,
    lastCheckTime: now
  });
  
  // Si alcanzamos el umbral y no está marcado como caído, alertar
  if (consecutiveFailures >= FAILURE_THRESHOLD && !status.isDown) {
    await triggerPRTGDownAlert(location, errorMessage);
    updateHealthStatus(location, {
      isDown: true,
      lastAlertTime: now
    });
  } 
  // Si ya está marcado como caído, verificar cooldown
  else if (status.isDown) {
    const timeSinceLastAlert = now - status.lastAlertTime;
    
    if (timeSinceLastAlert >= ALERT_COOLDOWN) {
      console.log(`⏰ [PRTG-HEALTH] Cooldown cumplido, enviando alerta de recordatorio...`);
      await triggerPRTGDownAlert(location, errorMessage);
      updateHealthStatus(location, {
        lastAlertTime: now
      });
    } else {
      const remaining = ALERT_COOLDOWN - timeSinceLastAlert;
      console.log(`⏳ [PRTG-HEALTH] PRTG ${location.toUpperCase()} sigue caído, cooldown activo (${Math.floor(remaining / 60)} minutos restantes)`);
    }
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
  const prtgUrl = location === 'tandil' 
    ? 'http://38.253.65.250:8080'
    : 'http://38.159.225.250:8090';
  
  console.log(`🚨 [PRTG-HEALTH] Enviando alerta de PRTG caído: ${locationName}`);
  
  // Preparar mensaje
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

🔴 SERVIDOR PRTG NO RESPONDE

UBICACIÓN: ${locationName}
URL: ${prtgUrl}
ESTADO: No se puede conectar al servidor
ERROR: ${errorMessage}
FECHA/HORA: ${timestamp}

⚠️ IMPACTO:
- No se pueden consultar sensores de ${location === 'tandil' ? 'Tandil' : 'La Matanza'}
- Sistema de monitoreo automático afectado
- GitHub Actions reportará fallos hasta que se recupere

ACCIÓN REQUERIDA:
1. Verificar conectividad del servidor PRTG
2. Revisar si el servicio PRTG está corriendo
3. Verificar firewall y permisos de red

URL del dashboard: https://monitoreo-redes.vercel.app/
`.trim();

  // Enviar por email
  try {
    await sendAlertEmail(
      ALERT_RECIPIENTS,
      `🔴 ALERTA CRÍTICA: Servidor PRTG ${locationName} Caído`,
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
      status: 'PRTG Caído',
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
  const prtgUrl = location === 'tandil' 
    ? 'http://38.253.65.250:8080'
    : 'http://38.159.225.250:8090';
  
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

✅ SERVIDOR PRTG RECUPERADO

UBICACIÓN: ${locationName}
URL: ${prtgUrl}
ESTADO: Conexión restablecida
FECHA/HORA: ${timestamp}

✅ ESTADO ACTUAL:
- Servidor PRTG respondiendo correctamente
- Monitoreo automático restablecido
- GitHub Actions funcionando normalmente

URL del dashboard: https://monitoreo-redes.vercel.app/
`.trim();

  // Enviar por email
  try {
    await sendAlertEmail(
      ALERT_RECIPIENTS,
      `✅ RECUPERADO: Servidor PRTG ${locationName}`,
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
      status: 'PRTG Operativo',
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
