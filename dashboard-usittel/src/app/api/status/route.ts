/**
 * 🚨 API Route: Estado de Sensores Críticos
 * 
 * Ruta: /api/status
 * Método: GET
 * 
 * ¿Qué hace?
 * - Obtiene el estado actual de los 4 sensores críticos (IPLAN, ARSAT, TECO, CABASE)
 * - Devuelve datos en formato JSON limpio y fácil de usar
 * 
 * ¿Cómo se usa desde el frontend?
 * fetch('/api/status')
 *   .then(res => res.json())
 *   .then(data => console.log(data))
 */

import { NextResponse } from 'next/server';
import { processSensorData } from '@/lib/alertMonitor';
import prtgClient from '@/lib/prtgClient';

// Esta función se ejecuta cuando alguien hace GET a /api/status
export async function GET() {
  console.log('📡 [API] /api/status - Solicitud recibida');
  
  try {
    // 1️⃣ Llamar al cliente PRTG para obtener sensores críticos
    const sensorsData = await prtgClient.getCriticalSensors();
    
    // 2️⃣ Procesar cada sensor: guardar historial y detectar cambios
    for (const sensor of sensorsData) {
      await processSensorData(sensor);
    }
    
    // 2️⃣ Procesar cada sensor: guardar historial y detectar cambios
    for (const sensor of sensorsData) {
      await processSensorData(sensor);
    }
    
    // 3️⃣ Procesar los datos para que sean más fáciles de usar en el frontend
    // Convertimos el formato complejo de PRTG a algo simple
    const processedData = sensorsData.map((sensor: any) => {
      // Mapeo de IDs reales a nombres amigables
      const nameMapping: Record<string, string> = {
        '13682': 'CABASE',
        '13683': 'TECO (L2L x TECO)', 
        '13684': 'IPLANxARSAT (L2L x ARSAT)',
        '2137': 'ITTEL-RDA-1-TDL (vlan500-WAN)',
        '13673': 'ITTEL-RDB-1-TDL (RDB-DTV)'
      };
      
      const sensorId = String(sensor.objid || sensor.objid_raw || 'unknown');
      
      // Parsear lastcheck de forma determinística desde la cadena dd/MM/yyyy HH:mm:ss en UTC
      let lastCheckFormatted = sensor.lastcheck || '';
      const extractAndFormatUTCMinus3 = (source: string) => {
        // 1) Quitar HTML si viene con etiquetas
        const plain = source.replace(/<[^>]*>/g, ' ');
        // 2) Buscar patrón dd/mm/yyyy hh:mm:ss
        const m = plain.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (!m) return source; // si no encontramos, devolvemos original
        const [, dd, mm, yyyy, HH, MM, SS] = m;
        // Construir fecha como UTC
        const utcMs = Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(HH), parseInt(MM), parseInt(SS));
        // Restar 3 horas (Argentina)
        const argDate = new Date(utcMs - (3 * 60 * 60 * 1000));
        const day = String(argDate.getUTCDate()).padStart(2, '0');
        const month = String(argDate.getUTCMonth() + 1).padStart(2, '0');
        const year = argDate.getUTCFullYear();
        const hours = String(argDate.getUTCHours()).padStart(2, '0');
        const minutes = String(argDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(argDate.getUTCSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      };

      if (typeof lastCheckFormatted === 'string') {
        lastCheckFormatted = extractAndFormatUTCMinus3(lastCheckFormatted);
      }
      
      return {
        id: sensorId,
        name: nameMapping[sensorId] || sensor.sensor || 'Desconocido',
        device: sensor.device || '',
        status: sensor.status || 'Unknown',
        statusRaw: sensor.status_raw || 0,
        lastValue: sensor.lastvalue || 'N/A',
        lastCheck: lastCheckFormatted,
        message: sensor.message || 'Sin mensaje',
        priority: sensor.priority || 3
      };
    });

    // Log de debugging para ver los lastValue
    processedData.forEach((sensor: any) => {
      console.log(`📊 [DEBUG] ${sensor.name}: lastValue="${sensor.lastValue}"`);
    });
    
    // 4️⃣ Devolver respuesta exitosa
    console.log('✅ [API] /api/status - Datos obtenidos correctamente');
    
    return NextResponse.json({
      success: true,
      data: processedData,
      timestamp: new Date().toISOString(),
      count: processedData.length
    });
    
  } catch (error) {
    // 5️⃣ Si algo sale mal, devolver error
    console.error('❌ [API] /api/status - Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estado de sensores',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 } // Código HTTP 500 = Error del servidor
    );
  }
}
