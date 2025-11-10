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
import { processSensorData } from '@/lib/alertMonitor';
import { getPRTGClient, type PRTGLocation } from '@/lib/prtgClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos máximo

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetro location de la URL (por defecto 'tandil' para compatibilidad)
    const searchParams = request.nextUrl.searchParams;
    const location = (searchParams.get('location') || 'tandil') as PRTGLocation;
    
    // Log de inicio
    const startTime = Date.now();
    console.log(`🤖 [CRON] Iniciando chequeo automático de alertas para ${location.toUpperCase()}...`);
    
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
      : ['13682', '13684', '13683', '2137', '13673']; // IDs de Tandil
    
    const results = [];
    
    for (const sensorId of sensorIds) {
      try {
        const sensor = await prtgClient.getSensor(parseInt(sensorId));
        
        // Procesar el sensor (esto dispara alertas si es necesario)
        await processSensorData(sensor);
        
        results.push({
          sensor_id: sensorId,
          name: sensor.name,
          status: sensor.status,
          value: sensor.lastvalue,
          checked: true,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ [CRON] ${sensor.name}: ${sensor.status} - ${sensor.lastvalue}`);
        
      } catch (error) {
        console.error(`❌ [CRON] Error con sensor ${sensorId}:`, error);
        results.push({
          sensor_id: sensorId,
          checked: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [CRON] Chequeo completado para ${location.toUpperCase()} en ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      location: location,
      message: `Chequeo de alertas completado para ${location.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      results,
      note: 'Este endpoint debe ser llamado periódicamente por un servicio externo de cron'
    });
    
  } catch (error) {
    console.error('❌ [CRON] Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
