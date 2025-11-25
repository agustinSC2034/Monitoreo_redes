/**
 * 🤖 Cron Job Handler - Endpoint público para servicios externos
 * 
 * Este endpoint está diseñado para ser llamado por servicios de cron externos
 * como cron-job.org, UptimeRobot, GitHub Actions, etc.
 * 
 * Endpoint: GET /api/cron/check-alerts?location=tandil|matanza
 * 
 * Ejecuta el monitoreo de todos los sensores y dispara alertas si es necesario
 */

import { NextRequest, NextResponse } from 'next/server';
import { processSensorData, startMonitoringSession } from '@/lib/alertMonitor';
import { getPRTGClient, type PRTGLocation } from '@/lib/prtgClient';
import { recordPRTGFailure, recordPRTGSuccess } from '@/lib/prtgHealthMonitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos máximo

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetro location de la URL (por defecto 'tandil' para compatibilidad)
    const searchParams = request.nextUrl.searchParams;
    const location = (searchParams.get('location') || 'tandil') as PRTGLocation;
    
    // 🔑 Iniciar nueva sesión de monitoreo (evita duplicados en esta ejecución)
    const sessionId = startMonitoringSession(`cron_${location}_${Date.now()}`);
    
    // Log de inicio
    const startTime = Date.now();
    console.log(`🤖 [CRON] Iniciando chequeo automático de alertas para ${location.toUpperCase()}... [Session: ${sessionId}]`);
    
    // Verificar token de seguridad (opcional pero recomendado)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn('⚠️ [CRON] Intento de acceso sin token válido');
      // Por ahora permitimos el acceso sin token para facilitar la configuración
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Obtener el cliente PRTG correcto según la ubicación
    const prtgClient = getPRTGClient(location);
    
    // Sensores a monitorear según ubicación
    const sensorIds = location === 'matanza' 
      ? ['5187', '4736', '4737', '5159', '3942', '6689', '4665', '4642'] // IDs de LARANET
      : ['13682', '13684', '13683', '2137', '13673', '13726']; // IDs de Tandil + WAN-to-RDB
    
    const results = [];
    let prtgConnectionFailed = false;
    let prtgErrorMessage = '';
    
    // Helper para delay entre sensores (evitar rate limiting)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < sensorIds.length; i++) {
      const sensorId = sensorIds[i];
      
      try {
        // Delay de 500ms entre sensores para evitar HTTP 429
        if (i > 0) {
          await delay(500);
        }
        
        console.log(`🔍 [CRON] Consultando sensor ${sensorId}...`);
        const sensor = await prtgClient.getSensor(parseInt(sensorId));
        
        console.log(`📊 [CRON] Sensor ${sensorId} (${sensor.name}): ${sensor.status} - ${sensor.lastvalue}`);
        
        // Procesar el sensor (esto dispara alertas si es necesario)
        console.log(`⚙️ [CRON] Procesando alertas para sensor ${sensorId}...`);
        await processSensorData(sensor);
        
        console.log(`✅ [CRON] Sensor ${sensorId} completado`);
        
        results.push({
          sensor_id: sensorId,
          name: sensor.name,
          status: sensor.status,
          value: sensor.lastvalue,
          checked: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ [CRON] Error con sensor ${sensorId}:`, errorMsg);
        
        // 🏥 Detectar fallo de conexión al PRTG
        if (errorMsg.includes('fetch') || 
            errorMsg.includes('ECONNREFUSED') || 
            errorMsg.includes('ETIMEDOUT') ||
            errorMsg.includes('Network') ||
            errorMsg.includes('Error HTTP')) {
          prtgConnectionFailed = true;
          prtgErrorMessage = errorMsg;
        }
        
        // Si es error 429, pausar más tiempo
        if (errorMsg.includes('429')) {
          console.warn(`⏸️ [CRON] Rate limit detectado, pausando 2 segundos...`);
          await delay(2000);
        }
        
        results.push({
          sensor_id: sensorId,
          checked: false,
          error: errorMsg
        });
      }
    }
    
    // 🏥 Actualizar estado de salud del PRTG
    if (prtgConnectionFailed) {
      console.error(`🏥 [PRTG-HEALTH] Detectado fallo de conexión al PRTG ${location.toUpperCase()}`);
      await recordPRTGFailure(location, prtgErrorMessage);
    } else {
      // Al menos un sensor se consultó exitosamente
      const successfulChecks = results.filter(r => r.checked).length;
      if (successfulChecks > 0) {
        console.log(`🏥 [PRTG-HEALTH] PRTG ${location.toUpperCase()} operativo (${successfulChecks}/${sensorIds.length} sensores consultados)`);
        await recordPRTGSuccess(location);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [CRON] Chequeo completado para ${location.toUpperCase()} en ${duration}ms`);
    
    // Crear respuesta con headers anti-caché explícitos
    const response = NextResponse.json({
      success: true,
      location: location,
      message: `Chequeo de alertas completado para ${location.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      results,
      note: 'Este endpoint debe ser llamado periódicamente por un servicio externo de cron'
    });
    
    // Headers para prevenir cualquier tipo de caché
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('❌ [CRON] Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
