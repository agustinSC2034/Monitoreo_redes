/**
 * 🗺️ Proxy Universal para PRTG
 * 
 * Proxy completo que maneja el mapa y TODOS sus recursos
 * Reescribe URLs dinámicamente para que funcionen via HTTPS
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const PRTG_BASE_URL = process.env.PRTG_BASE_URL || 'http://38.253.65.250:8080';
    const PRTG_USERNAME = process.env.PRTG_USERNAME || 'nocittel';
    const PRTG_PASSHASH = process.env.PRTG_PASSHASH || '413758319';
    
    // Obtener path solicitado desde query params
    const searchParams = request.nextUrl.searchParams;
    const resourcePath = searchParams.get('path') || '';
    
    let targetUrl: string;
    
    if (resourcePath) {
      // Recurso específico (JS, CSS, JSON, imagen, etc)
      targetUrl = `${PRTG_BASE_URL}${resourcePath}`;
    } else {
      // Mapa principal
      targetUrl = `${PRTG_BASE_URL}/public/mapshow.htm?id=2197&mapid=7418EC41-A903-47CF-87A2-70E6CC8AAFF5`;
    }
    
    // Agregar credenciales si no están
    if (!targetUrl.includes('username=') && !targetUrl.includes('passhash=')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}username=${PRTG_USERNAME}&passhash=${PRTG_PASSHASH}`;
    }
    
    console.log('🗺️ [MAP-PROXY] Fetching:', targetUrl);
    
    // Fetch del recurso
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ [MAP-PROXY] Error ${response.status} for ${targetUrl}`);
      throw new Error(`PRTG returned ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Si es HTML, reescribir URLs
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // Reescribir todas las URLs absolutas de PRTG
      html = html.replace(
        /http:\/\/38\.253\.65\.250:8080/g,
        '/api/map-proxy?path='
      );
      
      // Reescribir URLs relativas que empiecen con / (paths absolutos)
      html = html.replace(
        /(['"\(])(\/(api|public|javascript|css|images|webapplib)[^'"\)]*)/g,
        '$1/api/map-proxy?path=$2'
      );
      
      // Reescribir src y href sin dominio
      html = html.replace(
        /(src|href)=(["'])\/([^"']*)(["'])/g,
        '$1=$2/api/map-proxy?path=/$3$4'
      );
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Si es JavaScript, reescribir URLs también
    if (contentType.includes('javascript') || contentType.includes('json')) {
      let content = await response.text();
      
      // Reescribir URLs en JavaScript
      content = content.replace(
        /http:\/\/38\.253\.65\.250:8080/g,
        '/api/map-proxy?path='
      );
      
      // Reescribir paths relativos en strings
      content = content.replace(
        /(['"])(\/(api|public|javascript|css|images|webapplib)[^'"]*)/g,
        '$1/api/map-proxy?path=$2'
      );
      
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Para otros tipos (imágenes, CSS, etc), pasar directamente
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('❌ [MAP-PROXY] Error:', error);
    
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
            <button onclick="window.parent.location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
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
