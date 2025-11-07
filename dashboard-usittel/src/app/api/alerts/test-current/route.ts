/**
 * 🧪 API para probar alertas activas
 * 
 * Endpoint: GET /api/alerts/test-current
 * 
 * Muestra qué alertas están configuradas y permite probar el sistema
 */

import { NextResponse } from 'next/server';
import { getAlertRules } from '@/lib/db';

export async function GET() {
  try {
    // Obtener todas las reglas activas
    const activeRules = await getAlertRules(true);
    
    return NextResponse.json({
      success: true,
      total_rules: activeRules.length,
      rules: activeRules.map(rule => ({
        name: rule.name,
        sensor_id: rule.sensor_id,
        condition: rule.condition,
        threshold: rule.threshold,
        channels: rule.channels,
        priority: rule.priority,
        cooldown: `${rule.cooldown}s`
      })),
      info: {
        monitoring: 'Las alertas se chequean automáticamente cada vez que se actualiza el dashboard',
        types: {
          down: 'Sensor caído (status DOWN)',
          slow: 'Tráfico lento (threshold personalizado)',
          traffic_spike: 'Aumento drástico de tráfico (>50%)',
          traffic_drop: 'Caída drástica de tráfico (>50%)'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo alertas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
