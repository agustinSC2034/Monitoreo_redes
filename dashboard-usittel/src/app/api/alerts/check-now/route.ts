/**
 * 🔍 Forzar chequeo de alertas manualmente
 * 
 * Endpoint: GET /api/alerts/check-now
 * 
 * Ejecuta el monitoreo y chequea las alertas inmediatamente
 */

import { NextResponse } from 'next/server';
import prtgClient from '@/lib/prtgClient';
import { processSensorData } from '@/lib/alertMonitor';

export async function GET() {
  try {
    // Sensores a monitorear
    const sensorIds = ['13682', '13684', '13683', '2137', '13673'];
    const results = [];
    
    console.log('🔍 [CHECK-NOW] Iniciando chequeo manual de alertas...');
    
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
          checked: true
        });
        
        console.log(`✅ [CHECK-NOW] ${sensor.name}: ${sensor.status} - ${sensor.lastvalue}`);
        
      } catch (error) {
        console.error(`❌ [CHECK-NOW] Error con sensor ${sensorId}:`, error);
        results.push({
          sensor_id: sensorId,
          checked: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Chequeo de alertas completado',
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error('❌ [CHECK-NOW] Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
