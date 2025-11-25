/**
 * 📊 API: Estado de Sensores Pausados
 * 
 * Endpoint: GET /api/paused-sensors
 * 
 * Devuelve información sobre sensores críticos que están pausados en PRTG
 */

import { NextResponse } from 'next/server';
import { getPausedSensorsStats, hasCriticalSensorsPaused, getPausedCriticalSensors } from '@/lib/pausedSensorMonitor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getPausedSensorsStats();
    const hasPaused = hasCriticalSensorsPaused();
    const pausedList = getPausedCriticalSensors();
    
    return NextResponse.json({
      success: true,
      hasCriticalSensorsPaused: hasPaused,
      pausedCount: pausedList.length,
      pausedSensors: pausedList,
      details: stats,
      timestamp: new Date().toISOString(),
      note: 'Este endpoint muestra sensores críticos pausados en PRTG. Alertas deshabilitadas (solo logging).'
    });
  } catch (error) {
    console.error('❌ [API] /api/paused-sensors - Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
