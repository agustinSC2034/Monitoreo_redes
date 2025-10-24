/**
 * 📈 API Route: Datos Históricos
 * 
 * Ruta: /api/historical
 * Método: GET
 * Query params:
 *   - sensorId: ID del sensor (ej: 13682)
 *   - days: Días hacia atrás (default: 1)
 * 
 * Ejemplo: /api/historical?sensorId=13682&days=1
 */

import { NextResponse } from 'next/server';
import { getDateRange } from '@/lib/utils';
import prtgClient from '@/lib/prtgClient';

export async function GET(request: Request) {
  // Obtener parámetros de la URL
  const { searchParams } = new URL(request.url);
  const sensorId = searchParams.get('sensorId');
  const days = parseFloat(searchParams.get('days') || '1'); // parseFloat para soportar decimales (0.0833 = 2h)

  console.log(`📈 [API] /api/historical - Sensor ${sensorId}, ${days} días`);

  // Validar que se proporcionó el sensorId
  if (!sensorId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Se requiere el parámetro sensorId',
        example: '/api/historical?sensorId=13682&days=1'
      },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ Calcular rango de fechas
    const { startDate, endDate } = getDateRange(days);

    console.log(`📅 Rango: ${startDate} → ${endDate}`);

    // 2️⃣ CRÍTICO: Usar avg=0 para obtener valores RAW sin promediar
    // avg=0 devuelve valores cada 1 minuto tal como PRTG los registra
    // avg=300 devuelve promedios de 5 minutos (valores MÁS BAJOS que los reales)
    const avgInterval = 0; // ⚠️ DEBE SER 0 para coincidir con valores de tarjetas
    
    console.log(`⏱️ avgInterval: ${avgInterval} (valores RAW sin promediar)`);

    // 3️⃣ Obtener datos históricos de PRTG
    const historicalData = await prtgClient.getHistoricalData(
      parseInt(sensorId),
      startDate,
      endDate,
      avgInterval
    );

    // 4️⃣ Procesar datos para el gráfico
    // CRÍTICO: value ya viene en kbit/s (IN + OUT ya sumado y convertido en prtgClient.ts)
    // Las tarjetas usan "Trafico suma" que es exactamente IN + OUT
    const chartData = historicalData.histdata?.map((item: any) => {
      const valueKbits = item.value || 0; // Ya está en kbit/s (número directo)
      
      return {
        timestamp: item.datetime,
        datetime_raw: item.datetime_raw,
        value: valueKbits, // Ya está en kbit/s (IN + OUT)
        value_raw: valueKbits // Mismo valor para debugging
      };
    }) || [];

    // Log DETALLADO para debugging - primero, medio y último punto
    if (chartData.length > 0) {
      const first = chartData[0];
      const middle = chartData[Math.floor(chartData.length / 2)];
      const last = chartData[chartData.length - 1];
      console.log(`📊 [DEBUG] Sensor ${sensorId} - 3 muestras (IN+OUT):`);
      console.log(`   🔹 PRIMERO: ${first.value.toFixed(2)} kbit/s`);
      console.log(`   🔹 MEDIO: ${middle.value.toFixed(2)} kbit/s`);
      console.log(`   🔹 ÚLTIMO: ${last.value.toFixed(2)} kbit/s`);
    }

    console.log(`✅ [API] /api/historical - ${chartData.length} puntos de datos`);

    // 5️⃣ Devolver respuesta
    return NextResponse.json({
      success: true,
      data: chartData,
      sensorId,
      period: {
        days,
        startDate,
        endDate
      },
      count: chartData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [API] /api/historical - Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos históricos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
