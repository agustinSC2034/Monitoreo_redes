/**
 * 🗺️ Proxy para mapa PRTG
 * 
 * Soluciona el problema de Mixed Content para el iframe del mapa
 * Descarga el HTML desde PRTG (HTTP) en el servidor
 * y lo sirve al cliente a través de HTTPS
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const PRTG_BASE_URL = process.env.PRTG_BASE_URL || 'http://38.253.65.250:8080';
    const mapUrl = `${PRTG_BASE_URL}/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5`;
    
    // Descargar HTML del mapa desde PRTG
    const response = await fetch(mapUrl, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`PRTG returned ${response.status}`);
    }
    
    let html = await response.text();
    
    // Reemplazar referencias HTTP por referencias relativas o HTTPS
    // Esto asegura que todos los recursos dentro del iframe también se carguen correctamente
    html = html.replace(/http:\/\/38\.253\.65\.250:8080/g, PRTG_BASE_URL);
    
    // Retornar HTML con headers correctos
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'"
      }
    });
    
  } catch (error) {
    console.error('❌ Error en map-proxy:', error);
    
    // Retornar página de error amigable
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Error cargando mapa</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center; background: #f5f5f5;">
          <h1 style="color: #ef4444;">❌ Error al cargar el mapa</h1>
          <p style="color: #666;">No se pudo conectar con PRTG. Verifica la conexión.</p>
          <p style="color: #999; font-size: 14px;">${error instanceof Error ? error.message : 'Error desconocido'}</p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
