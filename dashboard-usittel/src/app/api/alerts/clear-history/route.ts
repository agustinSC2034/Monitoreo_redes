/**
 * 🗑️ API Route: Limpiar Historial de Alertas
 * 
 * Ruta: DELETE /api/alerts/clear-history
 * 
 * Elimina todas las alertas del historial
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function DELETE() {
  try {
    const db = getDB();
    
    // Eliminar todas las alertas
    const { error } = await db
      .from('alert_history')
      .delete()
      .neq('id', 0); // Eliminar todo (condición que siempre se cumple)
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Historial de alertas limpiado');
    
    return NextResponse.json({
      success: true,
      message: 'Historial de alertas eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error limpiando historial:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al limpiar historial',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
