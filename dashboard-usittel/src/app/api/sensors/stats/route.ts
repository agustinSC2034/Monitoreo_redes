/**
 * 📊 API Route: Estadísticas de Sensores
 * 
 * Rutas:
 * - GET /api/sensors/stats?sensor_id=13682&days=7 - Estadísticas de uptime
 * - GET /api/sensors/changes?sensor_id=13682 - Cambios de estado
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDowntimeEvents,
  getSensorHistory,
  getSensorUptime,
  getStatusChanges
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sensorId = searchParams.get('sensor_id');
    const days = parseInt(searchParams.get('days') || '7');
    const action = searchParams.get('action') || 'uptime';
    
    if (!sensorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere sensor_id'
        },
        { status: 400 }
      );
    }
    
    let data;
    
    switch (action) {
      case 'uptime':
        data = getSensorUptime(sensorId, days);
        break;
      
      case 'downtime':
        data = getDowntimeEvents(sensorId, days);
        break;
      
      case 'changes':
        data = getStatusChanges(sensorId, 100);
        break;
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '100');
        data = getSensorHistory(sensorId, limit);
        break;
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Acción no válida. Usar: uptime, downtime, changes, history'
          },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data,
      sensor_id: sensorId,
      action
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
