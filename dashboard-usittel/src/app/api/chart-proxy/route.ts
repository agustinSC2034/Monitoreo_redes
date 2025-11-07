/**
 * 🖼️ Proxy para gráficos de PRTG
 * 
 * Soluciona el problema de Mixed Content (HTTPS -> HTTP)
 * Descarga las imágenes desde PRTG (HTTP) en el servidor
 * y las sirve al cliente a través de HTTPS
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sensorId = searchParams.get('id');
    
    if (!sensorId) {
      return NextResponse.json({ error: 'Sensor ID required' }, { status: 400 });
    }

    const PRTG_BASE_URL = process.env.PRTG_BASE_URL || 'http://38.253.65.250:8080';
    const PRTG_USERNAME = process.env.PRTG_USERNAME || 'nocittel';
    const PRTG_PASSHASH = process.env.PRTG_PASSHASH || '413758319';
    
    // Construir URL del gráfico
    const chartUrl = `${PRTG_BASE_URL}/chart.png?type=graph&graphid=0&id=${sensorId}&width=1200&height=400&username=${PRTG_USERNAME}&passhash=${PRTG_PASSHASH}`;
    
    // Descargar imagen desde PRTG
    const response = await fetch(chartUrl, {
      cache: 'no-store' // No cachear para tener datos frescos
    });
    
    if (!response.ok) {
      throw new Error(`PRTG returned ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Retornar imagen con headers correctos
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en chart-proxy:', error);
    return NextResponse.json({
      error: 'Failed to fetch chart',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
