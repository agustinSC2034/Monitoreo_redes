/**
 * 🚨 API Route: Estado de Sensores Críticos
 * 
 * Ruta: /api/status?location=tandil|matanza
 * Método: GET
 * 
 * ¿Qué hace?
 * - Obtiene el estado actual de los sensores críticos según la ubicación
 * - TANDIL: IPLAN, ARSAT, TECO, CABASE
 * - MATANZA: Sensores de LARANET
 * - Devuelve datos en formato JSON limpio y fácil de usar
 * 
 * ¿Cómo se usa desde el frontend?
 * fetch('/api/status?location=tandil')
 *   .then(res => res.json())
 *   .then(data => console.log(data))
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPRTGClient, type PRTGLocation } from '@/lib/prtgClient';

// Esta función se ejecuta cuando alguien hace GET a /api/status
export async function GET(request: NextRequest) {
  // Obtener parámetro location de la URL (por defecto 'tandil')
  const searchParams = request.nextUrl.searchParams;
  const location = (searchParams.get('location') || 'tandil') as PRTGLocation;
  
  console.log(`📡 [API] /api/status - Solicitud recibida para ${location.toUpperCase()}`);
  
  try {
    // 1️⃣ Obtener el cliente PRTG correcto según la ubicación
    const prtgClient = getPRTGClient(location);
    
    // 2️⃣ Llamar al cliente PRTG para obtener sensores críticos
    const sensorsData = await prtgClient.getCriticalSensors();
    
    // ⚠️ NO PROCESAR SENSORES AQUÍ - Solo el endpoint /api/cron/check-alerts debe disparar alertas
    // Este endpoint es solo para obtener el estado actual y mostrarlo en el dashboard
    // await processSensorData(sensor); // DESHABILITADO
    
    // 3️⃣ Procesar los datos para que sean más fáciles de usar en el frontend
    // Convertimos el formato complejo de PRTG a algo simple
    const processedData = sensorsData.map((sensor: any) => {
      // Mapeo de IDs reales a nombres amigables
      const nameMappingTandil: Record<string, string> = {
        '13682': 'CABASE',
        '13683': 'TECO (L2L x TECO)', 
        '13684': 'IPLANxARSAT (L2L x ARSAT)',
        '2137': 'ITTEL-RDA-1-TDL (vlan500-WAN)',
        '13673': 'ITTEL-RDB-1-TDL (RDB-DTV)'
      };
      
      const nameMappingMatanza: Record<string, string> = {
        '5159': 'sfp28-10-WANxIPLAN',
        '4737': 'sfp28-12-WAN1-PPAL',
        '3942': 'sfp-sfpplus1-WAN LARA1-RDA-1-LARA',
        '5187': 'VLAN500-WAN (Lomas de Eziza)',
        '4736': 'sfp28-11-WAN2-BACKUP',
        '6689': 'IPTV-Modulador 1',
        '4665': 'VLAN500-WAN (LARA 2.2)',
        '4642': 'vlan500-iBGP (LARA 2.1)'
      };
      
      // Enlaces mayoristas (principales) - estos traen Internet desde afuera
      const wholesaleLinks: Record<string, string[]> = {
        'tandil': ['13682', '13684', '13683'], // CABASE, IPLANxARSAT, TECO
        'matanza': ['5159', '4737'] // sfp28-10-WANxIPLAN, sfp28-12-WAN1-PPAL
      };
      
      const nameMapping = location === 'matanza' ? nameMappingMatanza : nameMappingTandil;
      
      const sensorId = String(sensor.objid || sensor.objid_raw || 'unknown');
      
      // ⏰ Ajustar timezone del lastcheck (solo para Tandil)
      let adjustedLastCheck = sensor.lastcheck || '';
      if (typeof adjustedLastCheck === 'string' && adjustedLastCheck && location === 'tandil') {
        console.log(`[DEBUG-TZ] Original: "${adjustedLastCheck}"`);
        // Quitar HTML y texto "[hace X]"
        const clean = adjustedLastCheck
          .replace(/<[^>]*>/g, '') // Quitar tags HTML
          .replace(/\[hace[^\]]*\]/g, '') // Quitar "[hace X s]"
          .trim();
        console.log(`[DEBUG-TZ] Limpio: "${clean}"`);
        // Buscar fecha d/m/yyyy o dd/mm/yyyy hh:mm:ss (1 o 2 dígitos en día y mes)
        const match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
        console.log(`[DEBUG-TZ] Match resultado:`, match);
        if (match) {
          const [, dd, mm, yyyy, HH, MM, SS] = match;
          // Parsear como UTC y restar 3 horas
          const utcDate = new Date(Date.UTC(
            parseInt(yyyy),
            parseInt(mm) - 1,
            parseInt(dd),
            parseInt(HH),
            parseInt(MM),
            parseInt(SS)
          ));
          // Restar 3 horas (3 * 60 * 60 * 1000 ms)
          utcDate.setTime(utcDate.getTime() - (3 * 60 * 60 * 1000));
          // Formatear de vuelta
          const day = String(utcDate.getUTCDate()).padStart(2, '0');
          const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
          const year = utcDate.getUTCFullYear();
          const hours = String(utcDate.getUTCHours()).padStart(2, '0');
          const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
          const seconds = String(utcDate.getUTCSeconds()).padStart(2, '0');
          adjustedLastCheck = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
          console.log(`[TIMEZONE] Ajustado: ${sensor.lastcheck} -> ${adjustedLastCheck}`);
        }
      } else if (typeof adjustedLastCheck === 'string' && adjustedLastCheck) {
        // Para LARANET, solo limpiar el formato (ya viene en hora local)
        console.log(`[DEBUG-LARANET] Original lastcheck: "${adjustedLastCheck}"`);
        
        const clean = adjustedLastCheck
          .replace(/<[^>]*>/g, '') // Quitar tags HTML
          .replace(/\[hace[^\]]*\]/g, '') // Quitar "[hace X s]"
          .trim();
        
        console.log(`[DEBUG-LARANET] Limpio: "${clean}"`);
        
        // Buscar si hay formato 12h con AM/PM
        const match12h = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
        console.log(`[DEBUG-LARANET] Match 12h:`, match12h);
        
        if (match12h) {
          const [, dd, mm, yyyy, HH, MM, SS, ampm] = match12h;
          let hours = parseInt(HH);
          
          // Convertir a formato 24h
          if (ampm.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
          
          adjustedLastCheck = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy} ${String(hours).padStart(2, '0')}:${MM}:${SS}`;
          console.log(`[DEBUG-LARANET] Convertido a 24h: "${adjustedLastCheck}"`);
        } else {
          adjustedLastCheck = clean;
        }
      }
      
      return {
        id: sensorId,
        name: nameMapping[sensorId] || sensor.sensor || 'Desconocido',
        device: sensor.device || '',
        status: sensor.status || 'Unknown',
        statusRaw: sensor.status_raw || 0,
        lastValue: sensor.lastvalue || 'N/A',
        lastCheck: adjustedLastCheck,
        message: sensor.message || 'Sin mensaje',
        priority: sensor.priority || 3,
        isWholesale: wholesaleLinks[location]?.includes(sensorId) || false
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
