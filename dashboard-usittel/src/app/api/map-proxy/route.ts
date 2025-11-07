/**
 * 🗺️ Proxy para mapa PRTG y recursos relacionados
 * 
 * Soluciona el problema de Mixed Content para el iframe del mapa
 * Maneja tanto el HTML como todos los recursos (JS, CSS, imágenes)
 * 
 * Uso:
 * - /api/map-proxy (sin params) → HTML del mapa
 * - /api/map-proxy?path=/api/somefile.js → Recurso específico
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const PRTG_BASE_URL = process.env.PRTG_BASE_URL || 'http://38.253.65.250:8080';
    const PRTG_USERNAME = process.env.PRTG_USERNAME || 'nocittel';
    const PRTG_PASSHASH = process.env.PRTG_PASSHASH || '413758319';
    
    // Obtener path solicitado (para recursos adicionales)
    const searchParams = request.nextUrl.searchParams;
    const resourcePath = searchParams.get('path');
    
    let targetUrl: string;
    
    if (resourcePath) {
      // Proxy para recurso específico (JS, CSS, imagen, etc)
      targetUrl = `${PRTG_BASE_URL}${resourcePath}`;
      
      // Agregar credenciales si el recurso las requiere
      if (!resourcePath.includes('username=')) {
        const separator = resourcePath.includes('?') ? '&' : '?';
        targetUrl += `${separator}username=${PRTG_USERNAME}&passhash=${PRTG_PASSHASH}`;
      }
    } else {
      // Proxy para el mapa principal
      targetUrl = `${PRTG_BASE_URL}/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5`;
    }
    
    console.log('🗺️ Map-proxy fetching:', targetUrl);
    
    // Descargar recurso desde PRTG
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`PRTG returned ${response.status} for ${targetUrl}`);
    }
    
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Si es HTML, reescribir URLs
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // Reemplazar todas las URLs absolutas de PRTG por el proxy
      html = html.replace(
        /http:\/\/38\.253\.65\.250:8080(\/[^"'\s]+)/g,
        '/api/map-proxy?path=$1'
      );
      
      // También reemplazar URLs relativas que empiecen con /
      html = html.replace(
        /(['"])(\/(?:api|css|javascript|images|public)[^"']+)(['"])/g,
        '$1/api/map-proxy?path=$2$3'
      );
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Para otros tipos de archivo (JS, CSS, imágenes), pasar directamente
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600' // Cache estático por 1 hora
      }
    });
    
  } catch (error) {
    console.error('❌ Error en map-proxy:', error);
    
    // Retornar página de error amigable
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Error cargando mapa</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: system-ui; padding: 40px; text-align: center; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 16px;">❌ Error al cargar el mapa</h1>
            <p style="color: #666; margin-bottom: 12px;">No se pudo conectar con el servidor PRTG.</p>
            <p style="color: #999; font-size: 14px; font-family: monospace; background: #f9f9f9; padding: 12px; border-radius: 6px;">
              ${error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
              🔄 Reintentar
            </button>
          </div>
        </body>
      </html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
