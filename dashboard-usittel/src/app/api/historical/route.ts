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
  const days = parseInt(searchParams.get('days') || '1');

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

    // 2️⃣ Obtener datos históricos de PRTG
    // avgInterval: 300 segundos = 5 minutos de promedio
    const historicalData = await prtgClient.getHistoricalData(
      parseInt(sensorId),
      startDate,
      endDate,
      300 // Promedios cada 5 minutos
    );

    // 3️⃣ Procesar datos para el gráfico
    // PRTG devuelve un array de valores con timestamps
    const chartData = historicalData.histdata?.map((item: any) => ({
      timestamp: item.datetime,
      datetime_raw: item.datetime_raw,
      value: parseFloat(item.value_raw || item.value || 0),
      valueFormatted: item.value || '0'
    })) || [];

    console.log(`✅ [API] /api/historical - ${chartData.length} puntos de datos`);

    // 4️⃣ Devolver respuesta
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
