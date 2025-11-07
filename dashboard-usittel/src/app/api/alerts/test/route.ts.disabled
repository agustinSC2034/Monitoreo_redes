/**
 * 🧪 API Route: Crear Alerta de Prueba
 * 
 * Ruta: /api/alerts/test
 * Método: POST
 * 
 * Crea una alerta de prueba en la base de datos para testing
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const db = getDB();
    
    // Insertar alerta de prueba
    const stmt = db.prepare(`
      INSERT INTO alert_history (
        sensor_id,
        sensor_name,
        alert_type,
        severity,
        message,
        triggered_at,
        acknowledged
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    
    stmt.run(
      '13684', // IPLANxARSAT
      'IPLANxARSAT (L2L x ARSAT)',
      'status_down',
      'critical',
      '⚠️ ALERTA DE PRUEBA: Este es un ejemplo de cómo se verán las alertas en la campanita. El sensor IPLANxARSAT ha sido marcado como DOWN para demostración.',
      now,
      0 // No reconocida
    );
    
    console.log('✅ Alerta de prueba creada exitosamente');
    
    return NextResponse.json({
      success: true,
      message: 'Alerta de prueba creada',
      alert: {
        sensor_id: '13684',
        sensor_name: 'IPLANxARSAT (L2L x ARSAT)',
        alert_type: 'status_down',
        severity: 'critical',
        triggered_at: now
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error al crear alerta de prueba:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear alerta de prueba',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const db = getDB();
    
    // Eliminar todas las alertas de prueba
    db.exec(`DELETE FROM alert_history WHERE message LIKE '%ALERTA DE PRUEBA%'`);
    
    console.log('✅ Alertas de prueba eliminadas');
    
    return NextResponse.json({
      success: true,
      message: 'Alertas de prueba eliminadas',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar alertas de prueba:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar alertas de prueba',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
