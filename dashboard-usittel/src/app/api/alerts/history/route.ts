/**
 * 📜 API Route: Historial de Alertas
 * 
 * Ruta: GET /api/alerts/history
 * 
 * Devuelve el historial de alertas disparadas
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAlertHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const history = getAlertHistory(limit);
    
    return NextResponse.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial de alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener historial de alertas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
