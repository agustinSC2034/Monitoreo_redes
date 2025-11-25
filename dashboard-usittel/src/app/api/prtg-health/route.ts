/**
 * 🏥 API Endpoint - Estado de Salud de Servidores PRTG
 * 
 * GET /api/prtg-health
 * 
 * Retorna el estado actual de conectividad con los servidores PRTG
 */

import { NextResponse } from 'next/server';
import { getPRTGHealthStats } from '@/lib/prtgHealthMonitor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getPRTGHealthStats();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      servers: stats,
      note: 'Estado de salud de servidores PRTG monitoreados'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estado de salud:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
